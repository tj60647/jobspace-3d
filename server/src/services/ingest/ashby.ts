import fetch from 'node-fetch';
import { config } from '../../config.js';
import type { JobListing } from './types.js';

export async function fetchAshbyJobs(): Promise<JobListing[]> {
  const orgs = config.ASHBY_ORGS?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const jobs: JobListing[] = [];
  
  for (const org of orgs) {
    try {
      console.log(`Fetching Ashby jobs for org: ${org}`);
      
      const url = `https://api.ashbyhq.com/posting-api/job-board/${org}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Ashby API error for ${org}: ${response.status}`);
        continue;
      }
      
      const data = await response.json() as any;
      
      if (data.jobPostings && Array.isArray(data.jobPostings)) {
        for (const job of data.jobPostings) {
          jobs.push({
            title: job.title || 'Unknown Title',
            company: org,
            description: job.description || '',
            applyUrl: job.jobPostingUrl || '',
            location: job.locationName,
            postedAt: job.publishedDate ? new Date(job.publishedDate) : new Date(),
          });
        }
      }
      
      console.log(`Found ${data.jobPostings?.length || 0} jobs from Ashby org ${org}`);
    } catch (error) {
      console.error(`Error fetching Ashby jobs for ${org}:`, error);
    }
  }
  
  return jobs;
}