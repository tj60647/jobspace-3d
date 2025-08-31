import fetch from 'node-fetch';
import { config } from '../../config.js';
import type { JobListing } from './types.js';

export async function fetchGreenhouseJobs(): Promise<JobListing[]> {
  const boards = config.GREENHOUSE_BOARDS?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const jobs: JobListing[] = [];
  
  for (const board of boards) {
    try {
      console.log(`Fetching Greenhouse jobs for board: ${board}`);
      
      const url = `https://boards-api.greenhouse.io/v1/boards/${board}/jobs`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Greenhouse API error for ${board}: ${response.status}`);
        continue;
      }
      
      const data = await response.json() as any;
      
      if (data.jobs && Array.isArray(data.jobs)) {
        for (const job of data.jobs) {
          jobs.push({
            title: job.title || 'Unknown Title',
            company: board, // Use board name as company
            description: job.content || '',
            applyUrl: job.absolute_url || '',
            location: job.location?.name,
            postedAt: job.updated_at ? new Date(job.updated_at) : new Date(),
          });
        }
      }
      
      console.log(`Found ${data.jobs?.length || 0} jobs from Greenhouse board ${board}`);
    } catch (error) {
      console.error(`Error fetching Greenhouse jobs for ${board}:`, error);
    }
  }
  
  return jobs;
}