import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const { q, company, location, remote, limit = '100', offset = '0' } = req.query;

    const where: any = {};

    // Basic text filtering (future enhancement: full-text search with GIN)
    if (q && typeof q === 'string') {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { normalizedTitle: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (company && typeof company === 'string') {
      where.company = { contains: company, mode: 'insensitive' };
    }

    if (location && typeof location === 'string') {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (remote === 'true') {
      where.remoteAllowed = true;
    }

    const jobs = await prisma.job.findMany({
      where,
      select: {
        id: true,
        company: true,
        title: true,
        description: true,
        location: true,
        remoteAllowed: true,
        url: true,
        source: true,
        postedAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const total = await prisma.job.count({ where });

    res.json({
      jobs,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: total > parseInt(offset as string) + parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

export default router;