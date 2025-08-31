import { Router } from 'express';
import { getEmbeddingProvider } from '../services/embedding';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 10000) {
      return res.status(400).json({ error: 'Text too long (max 10000 characters)' });
    }

    const embeddingProvider = getEmbeddingProvider();
    const embedding = await embeddingProvider.getEmbedding(text);

    res.json({ embedding });
  } catch (error) {
    console.error('Error generating embedding:', error);
    res.status(500).json({ error: 'Failed to generate embedding' });
  }
});

export default router;