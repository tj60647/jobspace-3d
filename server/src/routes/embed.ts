import express from 'express';
import { z } from 'zod';
import { getRateLimiter } from '../util/rateLimit.js';
import { selectEmbeddingProvider } from '../services/embeddings/select.js';

export const router = express.Router();

const embedRequestSchema = z.object({
  text: z.string().min(1).max(10000),
});

const rateLimiter = getRateLimiter('embed', 60, 60 * 1000); // 60 requests per minute

router.post('/', async (req, res) => {
  try {
    // Rate limiting
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    if (!rateLimiter.allow(clientIp)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Maximum 60 requests per minute.' 
      });
    }

    // Validate request
    const { text } = embedRequestSchema.parse(req.body);

    // Get embedding provider
    const embeddingProvider = selectEmbeddingProvider();
    
    // Generate embedding (note: we do NOT log the text for privacy)
    const embedding = await embeddingProvider.generateEmbedding(text);

    res.json({ embedding });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        details: error.errors 
      });
    }
    
    console.error('Error generating embedding:', error);
    res.status(500).json({ error: 'Failed to generate embedding' });
  }
});