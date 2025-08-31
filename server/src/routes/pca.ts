import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { recomputePCA } from '../services/pca';

const router = Router();
const prisma = new PrismaClient();

// Admin-protected PCA recompute endpoint
router.post('/recompute', async (req, res) => {
  try {
    const adminToken = req.headers['x-admin-token'];
    
    if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await recomputePCA();
    
    res.json({
      message: 'PCA recomputed successfully',
      ...result
    });
  } catch (error) {
    console.error('Error recomputing PCA:', error);
    res.status(500).json({ error: 'Failed to recompute PCA' });
  }
});

export default router;