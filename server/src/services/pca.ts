import { Matrix, SVD } from 'ml-matrix';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PCAResult {
  totalJobs: number;
  explainedVariance: number[];
  updatedJobs: number;
}

export async function recomputePCA(): Promise<PCAResult> {
  console.log('Starting PCA recomputation...');

  // Fetch all jobs with embeddings
  const jobs = await prisma.job.findMany({
    where: {
      embedding: { not: null }
    },
    select: {
      id: true,
      embedding: true
    }
  });

  if (jobs.length < 3) {
    throw new Error('Need at least 3 jobs with embeddings for PCA');
  }

  console.log(`Found ${jobs.length} jobs with embeddings`);

  // Convert embeddings to matrix
  const embeddingMatrix = new Matrix(
    jobs.map((job: any) => job.embedding as number[])
  );

  // Center the data (subtract mean)
  const meanVector = embeddingMatrix.mean('column');
  const centeredMatrix = embeddingMatrix.subRowVector(meanVector);

  // Perform SVD for PCA
  console.log('Computing SVD...');
  const svd = new SVD(centeredMatrix, { computeLeftSingularVectors: false, computeRightSingularVectors: true });

  // Get first 3 principal components
  const components = svd.rightSingularVectors.subMatrix(0, 2, 0, svd.rightSingularVectors.columns - 1);

  // Project data onto first 3 components
  const projectedData = centeredMatrix.mmul(components.transpose());

  // Calculate explained variance ratios
  const totalVariance = svd.diagonal.reduce((sum, val) => sum + val * val, 0);
  const explainedVariance = svd.diagonal.slice(0, 3).map(val => (val * val) / totalVariance);

  console.log('Explained variance ratios:', explainedVariance);

  // Scale coordinates to [-0.5, 0.5] for consistent scene framing
  const coordinates = scaleCoordinates(projectedData.to2DArray());

  // Store PCA model
  const pcaModel = await prisma.pcaModel.create({
    data: {
      components: components.to2DArray(),
      meanVector: Array.from(meanVector),
      explainedVar: explainedVariance,
      totalJobs: jobs.length
    }
  });

  console.log('Stored PCA model:', pcaModel.id);

  // Update job coordinates
  console.log('Updating job coordinates...');
  const updatePromises = jobs.map(async (job: any, index: number) => {
    const [x, y, z] = coordinates[index];
    return prisma.job.update({
      where: { id: job.id },
      data: { x, y, z }
    });
  });

  await Promise.all(updatePromises);

  console.log(`Updated coordinates for ${jobs.length} jobs`);

  return {
    totalJobs: jobs.length,
    explainedVariance,
    updatedJobs: jobs.length
  };
}

function scaleCoordinates(coordinates: number[][]): number[][] {
  // Find min and max for each dimension
  const mins = [Infinity, Infinity, Infinity];
  const maxs = [-Infinity, -Infinity, -Infinity];

  coordinates.forEach(([x, y, z]) => {
    mins[0] = Math.min(mins[0], x);
    mins[1] = Math.min(mins[1], y);
    mins[2] = Math.min(mins[2], z);
    maxs[0] = Math.max(maxs[0], x);
    maxs[1] = Math.max(maxs[1], y);
    maxs[2] = Math.max(maxs[2], z);
  });

  // Scale to [-0.5, 0.5]
  return coordinates.map(([x, y, z]) => [
    scaleValue(x, mins[0], maxs[0]),
    scaleValue(y, mins[1], maxs[1]),
    scaleValue(z, mins[2], maxs[2])
  ]);
}

function scaleValue(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return ((value - min) / (max - min)) - 0.5;
}