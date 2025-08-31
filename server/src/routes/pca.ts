import { Router } from 'express';

const router = Router();

// Admin-protected PCA recompute endpoint
router.post('/recompute', async (req, res) => {
  try {
    const adminToken = req.headers['x-admin-token'];
    
    if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock PCA recomputation for demonstration
    res.json({
      message: 'PCA recomputed successfully',
      totalJobs: 50,
      explainedVariance: [0.45, 0.23, 0.18],
      updatedJobs: 50
    });
  } catch (error) {
    console.error('Error recomputing PCA:', error);
    res.status(500).json({ error: 'Failed to recompute PCA' });
  }
});

export default router;