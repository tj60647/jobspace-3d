export interface JobPoint {
  id: string;
  title: string;
  company: string;
  applyUrl: string | null;
  postedAt: string;
  x: number;
  y: number;
  z: number;
}

export interface PositionsResponse {
  jobs: JobPoint[];
  pcaUpdatedAt: string | null;
}

export interface EmbedResponse {
  embedding: number[];
}

export interface JobsResponse {
  jobs: JobPoint[];
  total: number;
  limit: number;
  offset: number;
}