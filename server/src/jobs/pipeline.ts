import { prisma } from '../index';
import { getEmbeddingProvider } from '../services/embedding';
import { recomputePCA } from '../services/pca';
import { getAvailableCollectors } from './collectors';
import { RawJob } from './collectors/base';
import { normalizeTitle, generateSimHash, extractTextPreview } from '../utils/text';
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

export interface IngestionResult {
  source: string;
  jobsFound: number;
  jobsInserted: number;
  jobsUpdated: number;
  errors: string[];
  duration: number;
}

export class JobIngestionPipeline {
  private embeddingProvider = getEmbeddingProvider();
  private batchSize = 10; // Process embeddings in batches

  async ingestAll(): Promise<IngestionResult[]> {
    const collectors = getAvailableCollectors();
    const results: IngestionResult[] = [];

    for (const collector of collectors) {
      const result = await this.ingestFromCollector(collector);
      results.push(result);
    }

    // Recompute PCA after all ingestion
    if (results.some(r => r.jobsInserted > 0 || r.jobsUpdated > 0)) {
      console.log('Recomputing PCA after ingestion...');
      try {
        await recomputePCA();
        console.log('PCA recomputation completed');
      } catch (error) {
        console.error('Error recomputing PCA:', error);
      }
    }

    return results;
  }

  private async ingestFromCollector(collector: any): Promise<IngestionResult> {
    const startTime = Date.now();
    let jobsInserted = 0;
    let jobsUpdated = 0;
    const errors: string[] = [];

    console.log(`Starting ingestion from ${collector.name}...`);

    const logData: any = {
      source: collector.name,
      status: 'success',
      jobsFound: 0,
      jobsInserted: 0,
      jobsUpdated: 0,
      errorMessage: null,
      duration: 0
    };

    try {
      const rawJobs = await collector.collect();
      logData.jobsFound = rawJobs.length;

      console.log(`Found ${rawJobs.length} jobs from ${collector.name}`);

      // Process jobs in batches
      for (let i = 0; i < rawJobs.length; i += this.batchSize) {
        const batch = rawJobs.slice(i, i + this.batchSize);
        
        try {
          const result = await this.processBatch(batch, collector.name);
          jobsInserted += result.inserted;
          jobsUpdated += result.updated;
        } catch (error) {
          const errorMsg = `Batch ${i}-${i + batch.length}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      logData.jobsInserted = jobsInserted;
      logData.jobsUpdated = jobsUpdated;

      if (errors.length > 0) {
        logData.status = 'partial';
        logData.errorMessage = errors.join('; ');
      }

    } catch (error) {
      console.error(`Error in ${collector.name} ingestion:`, error);
      logData.status = 'error';
      logData.errorMessage = String(error);
      errors.push(String(error));
    }

    const duration = Date.now() - startTime;
    logData.duration = duration;

    // Log ingestion result
    await prismaClient.ingestionLog.create({ data: logData });

    console.log(`Completed ${collector.name} ingestion: ${jobsInserted} inserted, ${jobsUpdated} updated, ${errors.length} errors`);

    return {
      source: collector.name,
      jobsFound: logData.jobsFound,
      jobsInserted,
      jobsUpdated,
      errors,
      duration
    };
  }

  private async processBatch(jobs: RawJob[], source: string): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    for (const rawJob of jobs) {
      try {
        const normalizedJob = this.normalizeJob(rawJob, source);
        
        // Check for existing job (deduplication)
        const existing = await prismaClient.job.findFirst({
          where: {
            OR: [
              { externalId: normalizedJob.externalId },
              {
                AND: [
                  { company: normalizedJob.company },
                  { normalizedTitle: normalizedJob.normalizedTitle },
                  { simHash: normalizedJob.simHash }
                ]
              }
            ]
          }
        });

        if (existing) {
          // Update existing job
          await prismaClient.job.update({
            where: { id: existing.id },
            data: {
              title: normalizedJob.title,
              description: normalizedJob.description,
              location: normalizedJob.location,
              remoteAllowed: normalizedJob.remoteAllowed,
              url: normalizedJob.url,
              postedAt: normalizedJob.postedAt,
              updatedAt: new Date()
            }
          });
          updated++;
        } else {
          // Generate embedding
          const embeddingText = this.getEmbeddingText(normalizedJob);
          const embedding = await this.embeddingProvider.getEmbedding(embeddingText);

          // Insert new job
          await prismaClient.job.create({
            data: {
              ...normalizedJob,
              embedding
            }
          });
          inserted++;
        }
      } catch (error) {
        console.error(`Error processing job ${rawJob.externalId}:`, error);
        throw error;
      }
    }

    return { inserted, updated };
  }

  private normalizeJob(rawJob: RawJob, source: string) {
    const normalizedTitle = normalizeTitle(rawJob.title);
    const descriptionPreview = extractTextPreview(rawJob.description);
    const simHash = generateSimHash(`${rawJob.company} ${normalizedTitle} ${descriptionPreview}`);

    return {
      externalId: rawJob.externalId,
      company: rawJob.company.trim(),
      title: rawJob.title.trim(),
      normalizedTitle,
      description: rawJob.description.trim(),
      location: rawJob.location?.trim() || null,
      remoteAllowed: rawJob.remoteAllowed || false,
      url: rawJob.url || null,
      source,
      simHash,
      postedAt: rawJob.postedAt || new Date()
    };
  }

  private getEmbeddingText(job: any): string {
    // Combine title and description excerpt for embedding
    const descriptionExcerpt = extractTextPreview(job.description, 1000);
    return `${job.title}\n\n${descriptionExcerpt}`;
  }
}