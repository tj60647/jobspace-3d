export interface JobListing {
  title: string;
  company: string;
  description: string;
  applyUrl: string;
  location?: string;
  salary?: string;
  postedAt?: Date;
}

export interface IngestionResult {
  source: string;
  jobsFound: number;
  jobsAdded: number;
  errors: string[];
  success: boolean;
}