import fetch from 'node-fetch';
import { config } from '../../config.js';
import type { JobListing } from './types.js';

export async function fetchLeverJobs(): Promise<JobListing[]> {
  const companies = config.LEVER_COMPANIES?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const jobs: JobListing[] = [];
  
  for (const company of companies) {
    try {
      console.log(`Fetching Lever jobs for company: ${company}`);
      
      const url = `https://api.lever.co/v0/postings/${company}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Lever API error for ${company}: ${response.status}`);
        continue;
      }
      
      const data = await response.json() as any;
      
      if (Array.isArray(data)) {
        for (const job of data) {
          jobs.push({
            title: job.text || 'Unknown Title',
            company: company,
            description: job.description || '',
            applyUrl: job.applyUrl || job.hostedUrl || '',
            location: job.categories?.location,
            postedAt: job.createdAt ? new Date(job.createdAt) : new Date(),
          });
        }
      }
      
      console.log(`Found ${data.length || 0} jobs from Lever company ${company}`);
    } catch (error) {
      console.error(`Error fetching Lever jobs for ${company}:`, error);
    }
  }
  
  return jobs;
}