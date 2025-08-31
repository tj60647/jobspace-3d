import { Router } from 'express';

const router = Router();

// Mock data for demonstration
const mockJobs = [
  {
    id: '1',
    company: 'Example Tech',
    title: 'Frontend Developer',
    description: 'Build amazing user interfaces with React and TypeScript.',
    location: 'San Francisco, CA',
    remoteAllowed: true,
    url: 'https://example.com/jobs/1',
    source: 'greenhouse',
    postedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    company: 'Innovation Corp',
    title: 'Backend Engineer',
    description: 'Design scalable systems with Node.js and PostgreSQL.',
    location: 'New York, NY',
    remoteAllowed: false,
    url: 'https://example.com/jobs/2',
    source: 'lever',
    postedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
];

router.get('/', async (req, res) => {
  try {
    const { q, company, location, remote, limit = '100', offset = '0' } = req.query;

    let filteredJobs = [...mockJobs];

    // Basic filtering
    if (q && typeof q === 'string') {
      const query = q.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query)
      );
    }

    if (company && typeof company === 'string') {
      filteredJobs = filteredJobs.filter(job => 
        job.company.toLowerCase().includes(company.toLowerCase())
      );
    }

    if (location && typeof location === 'string') {
      filteredJobs = filteredJobs.filter(job => 
        job.location?.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (remote === 'true') {
      filteredJobs = filteredJobs.filter(job => job.remoteAllowed);
    }

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedJobs = filteredJobs.slice(offsetNum, offsetNum + limitNum);

    res.json({
      jobs: paginatedJobs,
      pagination: {
        total: filteredJobs.length,
        limit: limitNum,
        offset: offsetNum,
        hasMore: filteredJobs.length > offsetNum + limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

export default router;