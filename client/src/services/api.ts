import { PositionsResponse, JobsResponse, EmbeddingResponse } from '../types/api';

const API_BASE = '/api';

export class ApiClient {
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Health check
  async health(): Promise<{ status: string }> {
    return this.get('/health');
  }

  // Get job positions for 3D visualization
  async getPositions(): Promise<PositionsResponse> {
    return this.get('/positions');
  }

  // Search jobs
  async searchJobs(params: {
    q?: string;
    company?: string;
    location?: string;
    remote?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<JobsResponse> {
    const searchParams: Record<string, string> = {};
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams[key] = String(value);
      }
    });

    return this.get('/jobs', searchParams);
  }

  // Generate embedding for text
  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    return this.post('/embed', { text });
  }
}

export const apiClient = new ApiClient();