import OpenAI from 'openai';

export interface EmbeddingProvider {
  getEmbedding(text: string): Promise<number[]>;
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required');
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.model = process.env.EMBEDDING_MODEL || 'text-embedding-3-large';
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text.substring(0, 8000) // Truncate to avoid token limits
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('OpenAI embedding error:', error);
      throw new Error('Failed to generate OpenAI embedding');
    }
  }
}

export class StubEmbeddingProvider implements EmbeddingProvider {
  private dimension: number = 256;

  async getEmbedding(text: string): Promise<number[]> {
    // Create deterministic embedding based on text hash
    const hash = this.simpleHash(text);
    const embedding: number[] = [];

    // Generate deterministic but pseudo-random embedding
    for (let i = 0; i < this.dimension; i++) {
      const seed = hash + i;
      const random = this.seededRandom(seed);
      embedding.push((random - 0.5) * 2); // Range [-1, 1]
    }

    // Normalize to unit vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}

export function getEmbeddingProvider(): EmbeddingProvider {
  const provider = process.env.EMBEDDING_PROVIDER || 'stub';

  switch (provider) {
    case 'openai':
      return new OpenAIEmbeddingProvider();
    case 'stub':
      return new StubEmbeddingProvider();
    default:
      throw new Error(`Unknown embedding provider: ${provider}`);
  }
}