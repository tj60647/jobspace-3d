#!/usr/bin/env node

import { runIngestionPipeline } from '../services/ingest/pipeline.js';

async function main() {
  console.log('Starting job ingestion pipeline...');
  
  try {
    const results = await runIngestionPipeline();
    
    console.log('\n=== Ingestion Results ===');
    for (const result of results) {
      console.log(`${result.source}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`  Jobs found: ${result.jobsFound}`);
      console.log(`  Jobs added: ${result.jobsAdded}`);
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.join(', ')}`);
      }
    }
    
    const totalFound = results.reduce((sum, r) => sum + r.jobsFound, 0);
    const totalAdded = results.reduce((sum, r) => sum + r.jobsAdded, 0);
    const successfulSources = results.filter(r => r.success).length;
    
    console.log('\n=== Summary ===');
    console.log(`Total jobs found: ${totalFound}`);
    console.log(`Total jobs added: ${totalAdded}`);
    console.log(`Successful sources: ${successfulSources}/${results.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error during ingestion:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

main();