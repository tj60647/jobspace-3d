import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        AND: [
          { x: { not: null } },
          { y: { not: null } },
          { z: { not: null } }
        ]
      },
      select: {
        id: true,
        company: true,
        title: true,
        x: true,
        y: true,
        z: true,
        source: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get PCA model info
    const pcaModel = await prisma.pcaModel.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        totalJobs: true,
        explainedVar: true,
        createdAt: true
      }
    });

    res.json({
      positions: jobs.map((job: any) => ({
        id: job.id,
        company: job.company,
        title: job.title,
        position: [job.x, job.y, job.z],
        source: job.source
      })),
      meta: {
        totalPositions: jobs.length,
        pcaModel: pcaModel ? {
          totalJobs: pcaModel.totalJobs,
          explainedVariance: pcaModel.explainedVar,
          updatedAt: pcaModel.createdAt
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

export default router;