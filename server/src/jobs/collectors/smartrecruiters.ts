import axios from 'axios';
import { BaseJobCollector, RawJob } from './base';

export class SmartRecruitersCollector extends BaseJobCollector {
  name = 'smartrecruiters';

  async collect(): Promise<RawJob[]> {
    const company = process.env.SMARTRECRUITERS_COMPANY;
    const token = process.env.SMARTRECRUITERS_TOKEN;
    
    if (!company) {
      console.warn('SMARTRECRUITERS_COMPANY not configured, skipping');
      return [];
    }

    const jobs: RawJob[] = [];

    try {
      const headers: any = {
        'Accept': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.get(
        `https://api.smartrecruiters.com/v1/companies/${company}/postings`,
        { headers }
      );
      
      for (const job of response.data.content) {
        jobs.push({
          externalId: `smartrecruiters_${job.id}`,
          company: company,
          title: job.name,
          description: this.sanitizeHtml(job.jobAd?.sections?.jobDescription?.text || ''),
          location: job.location?.city || job.location?.country,
          remoteAllowed: job.location?.remote || this.isRemoteJob(
            job.name, 
            job.location?.city || '', 
            job.jobAd?.sections?.jobDescription?.text || ''
          ),
          url: `https://jobs.smartrecruiters.com/${company}/${job.id}`,
          postedAt: new Date(job.releasedDate)
        });
      }
    } catch (error) {
      console.error(`Error fetching from SmartRecruiters for ${company}:`, error);
    }

    return jobs;
  }
}