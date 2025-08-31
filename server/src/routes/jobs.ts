import express from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';

export const router = express.Router();

const jobsQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.string().transform(Number).default('20'),
  offset: z.string().transform(Number).default('0'),
});

router.get('/', async (req, res) => {
  try {
    const { q, limit, offset } = jobsQuerySchema.parse(req.query);

    // Build where clause for search
    const where = q ? {
      OR: [
        { title: { contains: q, mode: 'insensitive' as const } },
        { company: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
        { location: { contains: q, mode: 'insensitive' as const } },
      ],
    } : {};

    // Get total count for pagination
    const total = await prisma.job.count({ where });

    // Get jobs with pagination
    const jobs = await prisma.job.findMany({
      where,
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
      take: Math.min(limit, 100), // Max 100 per request
      skip: offset,
    });

    res.json({
      jobs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});