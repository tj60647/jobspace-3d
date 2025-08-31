import { Router } from 'express';

const router = Router();

// Mock data for demonstration
const mockPositions = [
  {
    id: '1',
    company: 'Example Tech',
    title: 'Frontend Developer',
    position: [0.1, 0.2, -0.3],
    source: 'greenhouse'
  },
  {
    id: '2',
    company: 'Innovation Corp',
    title: 'Backend Engineer',
    position: [-0.2, 0.4, 0.1],
    source: 'lever'
  },
  {
    id: '3',
    company: 'AI Startup',
    title: 'Machine Learning Engineer',
    position: [0.3, -0.1, 0.2],
    source: 'ashby'
  },
  {
    id: '4',
    company: 'Design Co',
    title: 'UX Designer',
    position: [-0.4, -0.2, -0.1],
    source: 'recruitee'
  },
  {
    id: '5',
    company: 'Data Corp',
    title: 'Data Scientist',
    position: [0.2, 0.3, 0.4],
    source: 'smartrecruiters'
  }
];

// Add more mock positions for a fuller visualization
for (let i = 6; i <= 50; i++) {
  mockPositions.push({
    id: `${i}`,
    company: `Company ${i}`,
    title: `Position ${i}`,
    position: [
      (Math.random() - 0.5),
      (Math.random() - 0.5),
      (Math.random() - 0.5)
    ],
    source: ['greenhouse', 'lever', 'ashby', 'recruitee', 'smartrecruiters'][i % 5]
  });
}

router.get('/', async (req, res) => {
  try {
    res.json({
      positions: mockPositions,
      meta: {
        totalPositions: mockPositions.length,
        pcaModel: {
          totalJobs: mockPositions.length,
          explainedVariance: [0.45, 0.23, 0.18],
          updatedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

export default router;