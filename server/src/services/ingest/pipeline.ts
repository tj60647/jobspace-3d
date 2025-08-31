import { prisma } from '../../prisma.js';
import { selectEmbeddingProvider } from '../embeddings/select.js';
import { computePca3, project3 } from '../pca.js';
import { fetchGreenhouseJobs } from './greenhouse.js';
import { fetchLeverJobs } from './lever.js';
import { fetchAshbyJobs } from './ashby.js';
import { fetchRecruiteeJobs } from './recruitee.js';
import { fetchSmartRecruitersJobs } from './smartrecruiters.js';
import { createDedupeKey, chunkArray, delay } from './util.js';
import type { JobListing, IngestionResult } from './types.js';

export async function runIngestionPipeline(): Promise<IngestionResult[]> {
  const results: IngestionResult[] = [];
  
  // Collect jobs from all sources
  const sources = [
    { name: 'greenhouse', fetcher: fetchGreenhouseJobs },
    { name: 'lever', fetcher: fetchLeverJobs },
    { name: 'ashby', fetcher: fetchAshbyJobs },
    { name: 'recruitee', fetcher: fetchRecruiteeJobs },
    { name: 'smartrecruiters', fetcher: fetchSmartRecruitersJobs },
  ];
  
  const allJobs: JobListing[] = [];
  
  for (const source of sources) {
    const startTime = new Date();
    let jobsAdded = 0;
    const errors: string[] = [];
    
    try {
      console.log(`\n=== Ingesting from ${source.name} ===`);
      const jobs = await source.fetcher();
      
      console.log(`Fetched ${jobs.length} jobs from ${source.name}`);
      allJobs.push(...jobs);
      jobsAdded = jobs.length;
      
      // Log to database
      await prisma.ingestionLog.create({
        data: {
          source: source.name,
          jobsFound: jobs.length,
          jobsAdded,
          errors,
          startedAt: startTime,
          completedAt: new Date(),
          success: true,
        },
      });
      
      results.push({
        source: source.name,
        jobsFound: jobs.length,
        jobsAdded,
        errors,
        success: true,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMsg);
      
      console.error(`Error ingesting from ${source.name}:`, error);
      
      await prisma.ingestionLog.create({
        data: {
          source: source.name,
          jobsFound: 0,
          jobsAdded: 0,
          errors,
          startedAt: startTime,
          completedAt: new Date(),
          success: false,
        },
      });
      
      results.push({
        source: source.name,
        jobsFound: 0,
        jobsAdded: 0,
        errors,
        success: false,
      });
    }
  }
  
  if (allJobs.length === 0) {
    console.log('No jobs found from any source');
    return results;
  }
  
  console.log(`\n=== Processing ${allJobs.length} total jobs ===`);
  
  // Deduplicate jobs
  const dedupeMap = new Map<string, JobListing>();
  for (const job of allJobs) {
    const key = createDedupeKey(job.company, job.title, job.description);
    if (!dedupeMap.has(key)) {
      dedupeMap.set(key, job);
    }
  }
  
  const uniqueJobs = Array.from(dedupeMap.values());
  console.log(`After deduplication: ${uniqueJobs.length} unique jobs`);
  
  // Generate embeddings in batches
  const embeddingProvider = selectEmbeddingProvider();
  const batchSize = 10;
  const batches = chunkArray(uniqueJobs, batchSize);
  
  console.log(`Processing ${batches.length} batches of ${batchSize} jobs each`);
  
  const jobsWithEmbeddings: Array<JobListing & { embedding: number[] }> = [];
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Processing batch ${i + 1}/${batches.length}`);
    
    for (const job of batch) {
      try {
        // Create text for embedding (title + description)
        const embeddingText = `${job.title}\n${job.description}`;
        const embedding = await embeddingProvider.generateEmbedding(embeddingText);
        
        jobsWithEmbeddings.push({
          ...job,
          embedding,
        });
      } catch (error) {
        console.error(`Error generating embedding for job "${job.title}":`, error);
      }
    }
    
    // Rate limiting - delay between batches
    if (i < batches.length - 1) {
      await delay(1000); // 1 second delay
    }
  }
  
  console.log(`Generated embeddings for ${jobsWithEmbeddings.length} jobs`);
  
  // Upsert jobs to database
  let upsertedCount = 0;
  for (const job of jobsWithEmbeddings) {
    try {
      await prisma.job.upsert({
        where: {
          company_title: {
            company: job.company,
            title: job.title,
          },
        },
        update: {
          description: job.description,
          applyUrl: job.applyUrl,
          location: job.location,
          salary: job.salary,
          postedAt: job.postedAt || new Date(),
          embedding: job.embedding,
        },
        create: {
          title: job.title,
          company: job.company,
          description: job.description,
          applyUrl: job.applyUrl,
          location: job.location,
          salary: job.salary,
          postedAt: job.postedAt || new Date(),
          embedding: job.embedding,
        },
      });
      upsertedCount++;
    } catch (error) {
      console.error(`Error upserting job "${job.title}" from ${job.company}:`, error);
    }
  }
  
  console.log(`Upserted ${upsertedCount} jobs to database`);
  
  // Recompute PCA if we have jobs
  if (upsertedCount > 0) {
    await recomputePcaCoordinates();
  }
  
  return results;
}

async function recomputePcaCoordinates(): Promise<void> {
  try {
    console.log('\n=== Recomputing PCA coordinates ===');
    
    // Get all jobs with embeddings
    const jobs = await prisma.job.findMany({
      where: {
        embedding: { not: { equals: [] } },
      },
      select: {
        id: true,
        embedding: true,
      },
    });
    
    if (jobs.length < 3) {
      console.log('Not enough jobs for PCA computation (need at least 3)');
      return;
    }
    
    console.log(`Computing PCA for ${jobs.length} jobs`);
    
    // Compute PCA
    const embeddings = jobs.map(job => job.embedding);
    const { components, mean } = computePca3(embeddings);
    
    // Store PCA model
    await prisma.pcaModel.create({
      data: {
        components: components.flat(),
        mean,
        dimensions: 3,
      },
    });
    
    // Update job coordinates
    const updates = jobs.map(job => {
      const [x, y, z] = project3(job.embedding, components, mean);
      return {
        id: job.id,
        x,
        y,
        z,
      };
    });
    
    await Promise.all(
      updates.map(update =>
        prisma.job.update({
          where: { id: update.id },
          data: { x: update.x, y: update.y, z: update.z },
        })
      )
    );
    
    console.log(`Updated 3D coordinates for ${updates.length} jobs`);
  } catch (error) {
    console.error('Error recomputing PCA coordinates:', error);
  }
}