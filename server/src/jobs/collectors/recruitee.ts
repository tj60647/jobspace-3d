import axios from 'axios';
import { BaseJobCollector, RawJob } from './base';

export class RecruiteeCollector extends BaseJobCollector {
  name = 'recruitee';

  async collect(): Promise<RawJob[]> {
    const clients = process.env.RECRUITEE_CLIENTS?.split(',') || [];
    const jobs: RawJob[] = [];

    for (const client of clients) {
      try {
        const response = await axios.get(`https://${client}.recruitee.com/api/offers`);
        
        for (const job of response.data.offers) {
          jobs.push({
            externalId: `recruitee_${job.id}`,
            company: client,
            title: job.title,
            description: this.sanitizeHtml(job.description || ''),
            location: job.location,
            remoteAllowed: job.remote || this.isRemoteJob(job.title, job.location || '', job.description || ''),
            url: `https://${client}.recruitee.com/o/${job.slug}`,
            postedAt: new Date(job.created_at)
          });
        }
      } catch (error) {
        console.error(`Error fetching from Recruitee for ${client}:`, error);
      }
    }

    return jobs;
  }
}