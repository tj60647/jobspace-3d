# JobSpace 3D

A 3D visualization tool for job postings that uses machine learning to project job embeddings into 3D space, helping job seekers discover and explore career opportunities through an interactive point cloud.

## Features

- **3D Job Visualization**: Interactive scatter plot showing jobs as points in 3D space based on PCA-projected embeddings
- **Resume Matching**: Drop your resume (PDF/text) to highlight similar job opportunities
- **Multi-ATS Integration**: Ingests jobs from multiple sources (Greenhouse, Lever, Ashby, Recruitee, SmartRecruiters)
- **Real-time Embeddings**: Generate job embeddings using OpenAI or local stub provider
- **Interactive Exploration**: Click on job points to view details, orbit controls for navigation

## Architecture

This is a monorepo containing:

- **Server**: Node.js + TypeScript + Express + Prisma + PostgreSQL
- **Client**: React + Three.js (via react-three-fiber) + Tailwind CSS
- **Build System**: Vite for client, TypeScript compiler for server, npm workspaces

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- (Optional) OpenAI API key for production embeddings

### Environment Setup

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/jobspace3d"

# Embedding Provider (openai or stub)
EMBEDDING_PROVIDER=stub
OPENAI_API_KEY=your_openai_key_here
EMBEDDING_MODEL=text-embedding-3-large

# Admin API protection
ADMIN_TOKEN=your_secure_admin_token

# ATS API Configuration (optional)
GREENHOUSE_BOARDS=company1,company2
LEVER_COMPANIES=company1,company2
ASHBY_ORGS=org1,org2
RECRUITEE_CLIENTS=client1,client2
SMARTRECRUITERS_COMPANY=your_company
SMARTRECRUITERS_TOKEN=your_api_token

# Server
PORT=3000
```

### Installation & Development

```bash
# Install dependencies
npm install

# Set up database
npm run db:generate
npm run db:migrate

# Start development servers (both client and server)
npm run dev

# Or start individually
npm run dev:server  # Server on port 3000
npm run dev:client  # Client on port 5173
```

### Production Build

```bash
# Build both client and server
npm run build

# Start production server
npm start
```

## Data Ingestion

### Running Job Ingestion

The ingestion pipeline collects jobs from configured ATS systems, generates embeddings, and stores them in the database:

```bash
# Run the ingestion CLI
npm run ingest

# Or run directly
cd server && npm run ingest
```

### PCA Recomputation

After ingesting new jobs, recompute PCA to update 3D coordinates:

```bash
# Via admin API (requires ADMIN_TOKEN)
curl -X POST http://localhost:3000/api/pca/recompute \
  -H "X-Admin-Token: your_admin_token"

# PCA is also automatically run after ingestion
```

## API Endpoints

### Public Endpoints

- `GET /api/health` - Health check
- `GET /api/jobs` - Search/filter jobs with pagination
- `GET /api/positions` - Get job positions for 3D visualization
- `POST /api/embed` - Generate embeddings for text (rate limited)

### Admin Endpoints

- `POST /api/pca/recompute` - Recompute PCA and update coordinates (requires `X-Admin-Token`)

### Example API Usage

```javascript
// Get all job positions
const positions = await fetch('/api/positions').then(r => r.json());

// Search jobs
const jobs = await fetch('/api/jobs?q=frontend&company=google').then(r => r.json());

// Generate embedding
const embedding = await fetch('/api/embed', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Software engineer with React experience' })
}).then(r => r.json());
```

## Database Schema

### Jobs Table
- `id` - Unique identifier
- `externalId` - Source-specific ID for deduplication
- `company`, `title`, `normalizedTitle` - Job details
- `description` - Full job description
- `location`, `remoteAllowed` - Location information
- `embedding` - Vector embedding (Float[])
- `x`, `y`, `z` - PCA-projected coordinates
- `simHash` - Content hash for deduplication
- `source` - ATS source (greenhouse, lever, etc.)

### PCA Models Table
- Stores PCA transformation parameters
- `components` - Principal component vectors
- `meanVector` - Centering vector
- `explainedVar` - Explained variance ratios

### Ingestion Logs Table
- Tracks ingestion runs and statistics
- Job counts, errors, duration per source

## Deployment

### Heroku

The included `Procfile` supports Heroku deployment:

```bash
# Deploy to Heroku
git push heroku main

# Set environment variables
heroku config:set DATABASE_URL=postgresql://...
heroku config:set EMBEDDING_PROVIDER=openai
heroku config:set OPENAI_API_KEY=...
```

### Manual Deployment

```bash
# Build for production
npm run build

# Set environment variables
export DATABASE_URL=...
export EMBEDDING_PROVIDER=...

# Run migrations and start
npm run db:migrate
npm start
```

## Development Notes

### Embedding Providers

- **Stub Provider**: Generates deterministic 256-dimensional embeddings for development
- **OpenAI Provider**: Uses `text-embedding-3-large` model for production-quality embeddings

### PCA Scaling

Coordinates are scaled to [-0.5, 0.5] range for consistent 3D scene framing regardless of data distribution.

### Rate Limiting

The `/api/embed` endpoint is rate-limited to 10 requests per 15 minutes per IP address to prevent abuse.

### Job Deduplication

Jobs are deduplicated based on:
1. External ID from source system
2. Company + normalized title + content similarity hash

## Follow-up Development

Planned features for future releases:

- [ ] `/api/match` endpoint for semantic job matching
- [ ] PostgreSQL full-text search with GIN indexes
- [ ] Job clustering and automatic labeling
- [ ] Admin dashboard for ingestion management
- [ ] GitHub Actions CI/CD pipeline
- [ ] Enhanced similarity algorithms
- [ ] Real-time job updates via WebSocket

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues and questions, please use the GitHub issue tracker.