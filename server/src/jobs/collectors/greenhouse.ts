import axios from 'axios';
import { BaseJobCollector, RawJob } from './base';

export class GreenhouseCollector extends BaseJobCollector {
  name = 'greenhouse';

  async collect(): Promise<RawJob[]> {
    const boards = process.env.GREENHOUSE_BOARDS?.split(',') || [];
    const jobs: RawJob[] = [];

    for (const board of boards) {
      try {
        const response = await axios.get(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs`);
        
        for (const job of response.data.jobs) {
          const jobDetail = await this.fetchJobDetail(board, job.id);
          
          jobs.push({
            externalId: `greenhouse_${job.id}`,
            company: jobDetail.company || 'Unknown',
            title: job.title,
            description: this.sanitizeHtml(jobDetail.content || ''),
            location: job.location?.name,
            remoteAllowed: this.isRemoteJob(job.title, job.location?.name || '', jobDetail.content || ''),
            url: job.absolute_url,
            postedAt: new Date(job.updated_at)
          });
        }
      } catch (error) {
        console.error(`Error fetching from Greenhouse board ${board}:`, error);
      }
    }

    return jobs;
  }

  private async fetchJobDetail(board: string, jobId: string): Promise<any> {
    try {
      const response = await axios.get(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching job detail ${jobId}:`, error);
      return {};
    }
  }
}