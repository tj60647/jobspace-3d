import fetch from 'node-fetch';
import { config } from '../../config.js';
import type { JobListing } from './types.js';

export async function fetchRecruiteeJobs(): Promise<JobListing[]> {
  const clients = config.RECRUITEE_CLIENTS?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const jobs: JobListing[] = [];
  
  for (const client of clients) {
    try {
      console.log(`Fetching Recruitee jobs for client: ${client}`);
      
      const url = `https://${client}.recruitee.com/api/offers`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Recruitee API error for ${client}: ${response.status}`);
        continue;
      }
      
      const data = await response.json() as any;
      
      if (data.offers && Array.isArray(data.offers)) {
        for (const job of data.offers) {
          jobs.push({
            title: job.title || 'Unknown Title',
            company: client,
            description: job.description || '',
            applyUrl: job.careers_url || '',
            location: job.location,
            postedAt: job.created_at ? new Date(job.created_at) : new Date(),
          });
        }
      }
      
      console.log(`Found ${data.offers?.length || 0} jobs from Recruitee client ${client}`);
    } catch (error) {
      console.error(`Error fetching Recruitee jobs for ${client}:`, error);
    }
  }
  
  return jobs;
}