import type { PositionsResponse, EmbedResponse, JobsResponse } from './types';

const API_BASE = '/api';

export async function fetchPositions(): Promise<PositionsResponse> {
  const response = await fetch(`${API_BASE}/positions`);
  if (!response.ok) {
    throw new Error(`Failed to fetch positions: ${response.statusText}`);
  }
  return response.json();
}

export async function embedText(text: string): Promise<EmbedResponse> {
  const response = await fetch(`${API_BASE}/embed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait before trying again.');
    }
    throw new Error(`Failed to generate embedding: ${response.statusText}`);
  }
  
  return response.json();
}

export async function searchJobs(query?: string, limit = 20, offset = 0): Promise<JobsResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  
  if (query) {
    params.set('q', query);
  }
  
  const response = await fetch(`${API_BASE}/jobs?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to search jobs: ${response.statusText}`);
  }
  return response.json();
}