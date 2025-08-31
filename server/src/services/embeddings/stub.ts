import { createHash } from 'crypto';
import type { EmbeddingProvider } from './provider.js';

export class StubEmbeddingProvider implements EmbeddingProvider {
  async generateEmbedding(text: string): Promise<number[]> {
    // Generate deterministic pseudo-embedding using SHA-256
    const hash = createHash('sha256').update(text).digest();
    
    // Convert to 256-dimensional vector
    const embedding = new Array(256);
    for (let i = 0; i < 256; i++) {
      // Use each byte of the hash, cycling through if needed
      const byteIndex = i % hash.length;
      // Convert byte to float in range [-1, 1]
      embedding[i] = (hash[byteIndex] / 255) * 2 - 1;
    }
    
    // Normalize the vector to unit length
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }
    
    return embedding;
  }
}