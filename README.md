# 3D Job Map

A full-stack application that visualizes job opportunities in a 3D space using machine learning embeddings and Principal Component Analysis (PCA).

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Three.js** with **@react-three/fiber** for 3D rendering
- **@react-three/drei** for additional 3D utilities
- **PDF.js** for resume text extraction

### Backend
- **Node.js** with **TypeScript**
- **Express** web framework
- **Prisma** ORM with PostgreSQL
- **ml-matrix** for PCA computations
- **Zod** for data validation
- **OpenAI API** for text embeddings

## Project Layout

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── api.ts         # API client functions
│   │   ├── types.ts       # TypeScript type definitions
│   │   └── ...
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic
│   │   ├── jobs/          # CLI tools for ingestion
│   │   └── ...
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── package.json
├── scripts/               # Build and deployment scripts
└── package.json          # Root workspace configuration
```

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/jobspace3d

# Embedding Configuration
EMBEDDING_PROVIDER=openai        # or "stub" for development
OPENAI_API_KEY=your_openai_key
EMBEDDING_MODEL=text-embedding-3-large

# Security
ADMIN_TOKEN=your_secure_admin_token

# Job Board APIs (optional - configure as needed)
GREENHOUSE_BOARDS=company1,company2
LEVER_COMPANIES=company1,company2
ASHBY_ORGS=org1,org2
RECRUITEE_CLIENTS=client1,client2
SMARTRECRUITERS_COMPANY=company_id
SMARTRECRUITERS_TOKEN=your_token

# Server
PORT=3000
```

## Development

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key (for production embeddings)

### Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd jobspace-3d
npm install
```

2. **Set up the database:**
```bash
# Create database and run migrations
npm run -w server prisma:migrate:dev
```

3. **Start development servers:**
```bash
# Start both client and server in development mode
npm run dev
```

This will start:
- Client development server on http://localhost:5173
- Server API on http://localhost:3000

## Build

### Production Build
```bash
npm run build
```

This will:
1. Build the client React app
2. Build the server TypeScript code
3. Copy client build files to server's public directory

### Deployment
The app is configured for deployment on platforms like Heroku:

```bash
# The Procfile runs database migrations and starts the server
web: npm run -w server prisma:migrate && node server/dist/src/index.js
```

## Data Ingestion

Ingest job data from configured sources:

```bash
cd server
npm run ingest
```

This will:
1. Fetch jobs from all configured job boards
2. Generate embeddings for job descriptions
3. Deduplicate based on company + title + description hash
4. Store jobs in the database
5. Recompute PCA coordinates for 3D visualization

### Supported Job Boards
- Greenhouse
- Lever
- Ashby
- Recruitee  
- SmartRecruiters

## PCA Recompute

Manually trigger PCA recomputation (requires admin token):

```bash
curl -X POST http://localhost:3000/api/pca/recompute \
  -H "X-Admin-Token: your_admin_token"
```

## API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/jobs` - Search and filter jobs
  - Query params: `q` (search), `limit`, `offset`
- `GET /api/positions` - Get all jobs with 3D coordinates
- `POST /api/embed` - Generate text embedding (rate limited)

### Admin Endpoints  
- `POST /api/pca/recompute` - Recompute PCA coordinates
  - Requires: `X-Admin-Token` header

### Query Examples
```bash
# Get all positions for 3D visualization
GET /api/positions

# Search jobs
GET /api/jobs?q=javascript&limit=20&offset=0

# Generate embedding for resume text
POST /api/embed
Content-Type: application/json
{"text": "Software engineer with React experience..."}
```

## Security Notes

- **Rate Limiting**: The `/api/embed` endpoint is rate limited to 60 requests per minute per IP
- **Admin Protection**: PCA recompute endpoint requires admin token
- **Data Privacy**: Resume text and embeddings are not logged to prevent data leaks
- **Input Validation**: All API inputs are validated using Zod schemas

## Follow-up Tasks

### Immediate Improvements
- [ ] **Enhanced Search**: Add full-text search capabilities
- [ ] **Better Matching**: Implement cosine similarity for job matching
- [ ] **Clustering**: Add visual clustering labels in 3D space
- [ ] **Admin Dashboard**: Build UI for data management and analytics

### Infrastructure  
- [ ] **CI/CD Pipeline**: Automated testing and deployment
- [ ] **Monitoring**: Add application monitoring and alerting
- [ ] **Caching**: Implement Redis caching for embeddings and positions
- [ ] **Database Optimization**: Add indexes and query optimization

### Features
- [ ] **Job Filters**: Advanced filtering by location, salary, company size
- [ ] **User Profiles**: Save preferences and job applications
- [ ] **Real-time Updates**: WebSocket integration for live job updates
- [ ] **Mobile Support**: Responsive design and mobile optimization

## License

MIT License - see [LICENSE](LICENSE) file for details.