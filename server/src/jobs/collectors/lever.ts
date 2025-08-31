import axios from 'axios';
import { BaseJobCollector, RawJob } from './base';

export class LeverCollector extends BaseJobCollector {
  name = 'lever';

  async collect(): Promise<RawJob[]> {
    const companies = process.env.LEVER_COMPANIES?.split(',') || [];
    const jobs: RawJob[] = [];

    for (const company of companies) {
      try {
        const response = await axios.get(`https://api.lever.co/v0/postings/${company}`);
        
        for (const job of response.data) {
          jobs.push({
            externalId: `lever_${job.id}`,
            company: company,
            title: job.text,
            description: this.sanitizeHtml(job.description || ''),
            location: job.categories?.location,
            remoteAllowed: this.isRemoteJob(job.text, job.categories?.location || '', job.description || ''),
            url: job.hostedUrl,
            postedAt: new Date(job.createdAt)
          });
        }
      } catch (error) {
        console.error(`Error fetching from Lever for ${company}:`, error);
      }
    }

    return jobs;
  }
}