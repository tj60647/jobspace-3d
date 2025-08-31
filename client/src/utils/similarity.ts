export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function findMostSimilar(
  targetEmbedding: number[],
  embeddings: Array<{ id: string; embedding: number[] }>,
  topK: number = 10
): Array<{ id: string; similarity: number }> {
  const similarities = embeddings.map(item => ({
    id: item.id,
    similarity: cosineSimilarity(targetEmbedding, item.embedding)
  }));

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}