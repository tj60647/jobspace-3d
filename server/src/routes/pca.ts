import express from 'express';
import { config } from '../config.js';
import { computePca3, project3 } from '../services/pca.js';
import { prisma } from '../prisma.js';

export const router = express.Router();

// Middleware to check admin token
const requireAdminToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers['x-admin-token'];
  
  if (!token || token !== config.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized. Valid admin token required.' });
  }
  
  next();
};

router.post('/recompute', requireAdminToken, async (req, res) => {
  try {
    console.log('Starting PCA recomputation...');

    // Get all jobs with embeddings
    const jobs = await prisma.job.findMany({
      where: {
        embedding: { not: { equals: [] } },
      },
      select: {
        id: true,
        embedding: true,
      },
    });

    if (jobs.length === 0) {
      return res.status(400).json({ error: 'No jobs with embeddings found' });
    }

    console.log(`Found ${jobs.length} jobs with embeddings`);

    // Prepare embedding matrix
    const embeddings = jobs.map((job: any) => job.embedding);
    
    // Compute PCA
    const { components, mean } = computePca3(embeddings);
    
    // Store PCA model
    await prisma.pcaModel.create({
      data: {
        components: components.flat(), // Flatten matrix for storage
        mean,
        dimensions: 3,
      },
    });

    // Project all embeddings to 3D coordinates
    const updates = jobs.map((job: any) => {
      const [x, y, z] = project3(job.embedding, components, mean);
      return {
        id: job.id,
        x,
        y,
        z,
      };
    });

    // Update jobs with new coordinates
    await Promise.all(
      updates.map((update: any) =>
        prisma.job.update({
          where: { id: update.id },
          data: { x: update.x, y: update.y, z: update.z },
        })
      )
    );

    console.log(`Updated ${updates.length} jobs with 3D coordinates`);

    res.json({
      success: true,
      jobsProcessed: jobs.length,
      message: 'PCA recomputation completed successfully',
    });
  } catch (error) {
    console.error('Error during PCA recomputation:', error);
    res.status(500).json({ error: 'Failed to recompute PCA' });
  }
});