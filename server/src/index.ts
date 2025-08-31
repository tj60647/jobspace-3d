import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';

// Import routes
import { router as jobsRouter } from './routes/jobs.js';
import { router as embedRouter } from './routes/embed.js';
import { router as positionsRouter } from './routes/positions.js';
import { router as pcaRouter } from './routes/pca.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? false // In production, client is served from same origin
    : ['http://localhost:5173'], // Vite dev server
  credentials: true,
}));

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/jobs', jobsRouter);
app.use('/api/embed', embedRouter);
app.use('/api/positions', positionsRouter);
app.use('/api/pca', pcaRouter);

// Serve static files from client build
const publicPath = join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Serve React app for any non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(join(publicPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});