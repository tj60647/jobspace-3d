import { Matrix, EigenvalueDecomposition } from 'ml-matrix';

export interface PcaResult {
  components: number[][];
  mean: number[];
}

export function computePca3(embeddings: number[][]): PcaResult {
  if (embeddings.length === 0) {
    throw new Error('No embeddings provided for PCA computation');
  }

  // Convert to matrix
  const dataMatrix = new Matrix(embeddings);
  
  // Center the data (subtract mean)
  const mean = dataMatrix.mean('column');
  const centeredMatrix = dataMatrix.sub(Matrix.ones(dataMatrix.rows, 1).mmul(Matrix.rowVector(mean)));
  
  // Compute covariance matrix
  const covariance = centeredMatrix.transpose().mmul(centeredMatrix).div(centeredMatrix.rows - 1);
  
  // Compute eigenvalues and eigenvectors
  const eigen = new EigenvalueDecomposition(covariance);
  
  // Get top 3 principal components (eigenvectors with largest eigenvalues)
  const eigenVectors = eigen.eigenvectorMatrix;
  const eigenValues = eigen.realEigenvalues;
  
  // Sort by eigenvalue magnitude and take top 3
  const sortedIndices = eigenValues
    .map((val, idx) => ({ val: Math.abs(val), idx }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 3)
    .map(item => item.idx);
  
  // Extract top 3 components
  const components = sortedIndices.map(idx => 
    eigenVectors.getColumn(idx)
  );
  
  return {
    components,
    mean,
  };
}

export function project3(embedding: number[], components: number[][], mean: number[]): number[] {
  if (embedding.length !== mean.length) {
    throw new Error('Embedding dimension mismatch');
  }
  
  // Center the embedding
  const centered = embedding.map((val, idx) => val - mean[idx]);
  
  // Project onto each component
  const projected = components.map(component => {
    return centered.reduce((sum, val, idx) => sum + val * component[idx], 0);
  });
  
  return scaleMinMax3(projected);
}

export function scaleMinMax3(coords: number[]): number[] {
  // Scale to [-0.5, 0.5] range for each axis
  // This is a simple approach - in practice you might want to track
  // global min/max across all jobs for consistent scaling
  
  if (coords.length !== 3) {
    throw new Error('Expected 3D coordinates');
  }
  
  // For now, assume the PCA projections are roughly normalized
  // and just clamp to reasonable bounds
  return coords.map(coord => {
    // Clamp to [-2, 2] then scale to [-0.5, 0.5]
    const clamped = Math.max(-2, Math.min(2, coord));
    return clamped * 0.25; // Scale to [-0.5, 0.5]
  });
}