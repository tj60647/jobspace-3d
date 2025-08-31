#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { JobIngestionPipeline } from './pipeline';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting job ingestion pipeline...');
  
  try {
    const pipeline = new JobIngestionPipeline();
    const results = await pipeline.ingestAll();

    console.log('\n=== Ingestion Summary ===');
    let totalFound = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    results.forEach(result => {
      console.log(`${result.source}:`);
      console.log(`  Found: ${result.jobsFound}`);
      console.log(`  Inserted: ${result.jobsInserted}`);
      console.log(`  Updated: ${result.jobsUpdated}`);
      console.log(`  Errors: ${result.errors.length}`);
      console.log(`  Duration: ${result.duration}ms`);
      
      totalFound += result.jobsFound;
      totalInserted += result.jobsInserted;
      totalUpdated += result.jobsUpdated;
      totalErrors += result.errors.length;

      if (result.errors.length > 0) {
        console.log(`  Error details: ${result.errors.join(', ')}`);
      }
      console.log('');
    });

    console.log('=== Overall Summary ===');
    console.log(`Total jobs found: ${totalFound}`);
    console.log(`Total jobs inserted: ${totalInserted}`);
    console.log(`Total jobs updated: ${totalUpdated}`);
    console.log(`Total errors: ${totalErrors}`);

    if (totalInserted > 0 || totalUpdated > 0) {
      console.log('\nIngestion completed successfully!');
      process.exit(0);
    } else {
      console.log('\nNo jobs were processed.');
      process.exit(1);
    }

  } catch (error) {
    console.error('Fatal error during ingestion:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

main().catch(async (error) => {
  console.error('Unhandled error:', error);
  await prisma.$disconnect();
  process.exit(1);
});