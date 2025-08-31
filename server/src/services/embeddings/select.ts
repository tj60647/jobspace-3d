import { config } from '../../config.js';
import { OpenAIEmbeddingProvider } from './openai.js';
import { StubEmbeddingProvider } from './stub.js';
import type { EmbeddingProvider } from './provider.js';

let cachedProvider: EmbeddingProvider | null = null;

export function selectEmbeddingProvider(): EmbeddingProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  switch (config.EMBEDDING_PROVIDER) {
    case 'openai':
      cachedProvider = new OpenAIEmbeddingProvider();
      break;
    case 'stub':
    default:
      cachedProvider = new StubEmbeddingProvider();
      break;
  }

  return cachedProvider;
}