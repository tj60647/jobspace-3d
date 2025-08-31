import express from 'express';
import { prisma } from '../prisma.js';

export const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Get all jobs with their 3D coordinates
    const jobs = await prisma.job.findMany({
      where: {
        x: { not: null },
        y: { not: null },
        z: { not: null },
      },
      select: {
        id: true,
        title: true,
        company: true,
        applyUrl: true,
        postedAt: true,
        x: true,
        y: true,
        z: true,
      },
      orderBy: { postedAt: 'desc' },
    });

    // Get the latest PCA model update time
    const latestPcaModel = await prisma.pcaModel.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    res.json({
      jobs,
      pcaUpdatedAt: latestPcaModel?.createdAt || null,
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});