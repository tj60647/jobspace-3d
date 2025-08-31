import fetch from 'node-fetch';
import { config } from '../../config.js';
import type { EmbeddingProvider } from './provider.js';

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    if (!config.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for OpenAI embedding provider');
    }
    this.apiKey = config.OPENAI_API_KEY;
    this.model = config.EMBEDDING_MODEL;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: this.model,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      if (!data.data || !data.data[0] || !data.data[0].embedding) {
        throw new Error('Invalid response from OpenAI API');
      }

      return data.data[0].embedding;
    } catch (error) {
      console.error('Error generating OpenAI embedding:', error);
      throw new Error('Failed to generate embedding from OpenAI');
    }
  }
}