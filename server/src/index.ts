import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';

import healthRoutes from './routes/health';
import jobRoutes from './routes/jobs';
import embedRoutes from './routes/embed';
import positionRoutes from './routes/positions';
import pcaRoutes from './routes/pca';

const app = express();
const port = process.env.PORT || 3000;

// Initialize Prisma client
export const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting for embed endpoint
const embedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many embedding requests, please try again later'
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/embed', embedLimiter, embedRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/pca', pcaRoutes);

// Serve static files from client build
app.use(express.static(path.join(__dirname, '../public')));

// Catch all handler for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});