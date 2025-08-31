import fetch from 'node-fetch';
import { config } from '../../config.js';
import type { JobListing } from './types.js';

export async function fetchSmartRecruitersJobs(): Promise<JobListing[]> {
  const company = config.SMARTRECRUITERS_COMPANY;
  const token = config.SMARTRECRUITERS_TOKEN;
  
  if (!company) {
    console.log('No SmartRecruiters company configured, skipping');
    return [];
  }
  
  const jobs: JobListing[] = [];
  
  try {
    console.log(`Fetching SmartRecruiters jobs for company: ${company}`);
    
    const url = `https://api.smartrecruiters.com/v1/companies/${company}/postings`;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['X-SmartToken'] = token;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.error(`SmartRecruiters API error: ${response.status}`);
      return jobs;
    }
    
    const data = await response.json() as any;
    
    if (data.content && Array.isArray(data.content)) {
      for (const job of data.content) {
        jobs.push({
          title: job.name || 'Unknown Title',
          company: company,
          description: job.jobAd?.sections?.jobDescription?.text || '',
          applyUrl: job.ref || '',
          location: job.location?.city,
          postedAt: job.releasedDate ? new Date(job.releasedDate) : new Date(),
        });
      }
    }
    
    console.log(`Found ${data.content?.length || 0} jobs from SmartRecruiters`);
  } catch (error) {
    console.error('Error fetching SmartRecruiters jobs:', error);
  }
  
  return jobs;
}