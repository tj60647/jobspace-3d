import axios from 'axios';
import { BaseJobCollector, RawJob } from './base';

export class AshbyCollector extends BaseJobCollector {
  name = 'ashby';

  async collect(): Promise<RawJob[]> {
    const orgs = process.env.ASHBY_ORGS?.split(',') || [];
    const jobs: RawJob[] = [];

    for (const org of orgs) {
      try {
        const response = await axios.post('https://api.ashbyhq.com/posting-api/job-board', {
          organizationIdentifier: org
        });
        
        for (const job of response.data.jobPostings) {
          jobs.push({
            externalId: `ashby_${job.id}`,
            company: org,
            title: job.title,
            description: this.sanitizeHtml(job.descriptionHtml || ''),
            location: job.location || 'Remote',
            remoteAllowed: job.isRemote || this.isRemoteJob(job.title, job.location || '', job.descriptionHtml || ''),
            url: `https://jobs.ashbyhq.com/${org}/${job.id}`,
            postedAt: new Date(job.publishedAt)
          });
        }
      } catch (error) {
        console.error(`Error fetching from Ashby for ${org}:`, error);
      }
    }

    return jobs;
  }
}