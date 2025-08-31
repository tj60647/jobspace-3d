export interface Job {
  id: string;
  company: string;
  title: string;
  description: string;
  location?: string;
  remoteAllowed: boolean;
  url?: string;
  source: string;
  postedAt: string;
  createdAt: string;
}

export interface JobPosition {
  id: string;
  company: string;
  title: string;
  position: [number, number, number];
  source: string;
}

export interface PositionsResponse {
  positions: JobPosition[];
  meta: {
    totalPositions: number;
    pcaModel?: {
      totalJobs: number;
      explainedVariance: number[];
      updatedAt: string;
    };
  };
}

export interface JobsResponse {
  jobs: Job[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface EmbeddingResponse {
  embedding: number[];
}