export interface RawJob {
  externalId: string;
  company: string;
  title: string;
  description: string;
  location?: string;
  remoteAllowed?: boolean;
  url?: string;
  postedAt?: Date;
}

export interface JobCollector {
  name: string;
  collect(): Promise<RawJob[]>;
}

export abstract class BaseJobCollector implements JobCollector {
  abstract name: string;
  
  abstract collect(): Promise<RawJob[]>;

  protected sanitizeHtml(html: string): string {
    // Basic HTML stripping - in production, use a proper library like cheerio
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  protected isRemoteJob(title: string, location: string, description: string): boolean {
    const remoteKeywords = ['remote', 'work from home', 'distributed', 'anywhere'];
    const text = `${title} ${location} ${description}`.toLowerCase();
    return remoteKeywords.some(keyword => text.includes(keyword));
  }
}