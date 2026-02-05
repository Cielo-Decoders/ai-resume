# CareerLab AI - Docker Deployment Guide

## 🐳 Docker Configuration

This project includes complete Docker containerization for both frontend (React) and backend (FastAPI).

### 📦 Image Naming Convention

**Backend Image:**
- Name: `careerlab-ai/backend`
- Tags: `latest`, `{version}`
- Full name: `careerlab-ai/backend:latest`

**Frontend Image:**
- Name: `careerlab-ai/frontend`
- Tags: `latest`, `{version}`
- Full name: `careerlab-ai/frontend:latest`

### 🏗️ Project Structure

```
ai-resume/
├── client/                    # React frontend
│   ├── Dockerfile            # Multi-stage build with nginx
│   ├── nginx.conf            # Nginx configuration with API proxy
│   └── .dockerignore         # Frontend-specific ignore rules
├── server/                    # FastAPI backend
│   ├── Dockerfile            # Python 3.12 slim image
│   └── .dockerignore         # Backend-specific ignore rules
├── docker-compose.yml         # Orchestration configuration
├── docker-build.sh           # Automated build script
├── docker-run.sh             # Automated run script
├── .env.example              # Environment variables template
└── .dockerignore             # Root-level ignore rules
```

## 🚀 Quick Start

### 1. Setup Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

Required variables in `.env`:
```env
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
REACT_APP_API_URL=http://localhost:8000
```

### 2. Build Docker Images

**Option A: Using the automated script (Recommended)**
```bash
./docker-build.sh
```

**Option B: Build with specific version**
```bash
./docker-build.sh v1.0.0
```

**Option C: Manual build**
```bash
# Build backend
docker build -t careerlab-ai/backend:latest -f server/Dockerfile ./server

# Build frontend
docker build -t careerlab-ai/frontend:latest -f client/Dockerfile ./client
```

### 3. Run the Application

**Option A: Using the automated script (Recommended)**
```bash
./docker-run.sh
```

**Option B: Using docker-compose**
```bash
docker-compose up -d
```

### 4. Access the Application

- **Frontend (React App):** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Landing Page:** http://localhost:3000/

## 🔧 Docker Commands Reference

### Building Images

```bash
# Build both images
docker-compose build

# Build only backend
docker-compose build careerlab-backend

# Build only frontend
docker-compose build careerlab-frontend

# Build without cache
docker-compose build --no-cache
```

### Running Services

```bash
# Start all services
docker-compose up -d

# Start and view logs
docker-compose up

# Start specific service
docker-compose up -d careerlab-backend
```

### Viewing Logs

```bash
# View all logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f careerlab-backend

# View frontend logs only
docker-compose logs -f careerlab-frontend

# View last 100 lines
docker-compose logs --tail=100
```

### Managing Services

```bash
# Check service status
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart careerlab-backend
```

### Accessing Containers

```bash
# Execute bash in backend container
docker exec -it careerlab-backend /bin/bash

# Execute shell in frontend container
docker exec -it careerlab-frontend /bin/sh

# View container processes
docker-compose top
```

## 📋 Service Details

### Backend Service (careerlab-backend)

**Configuration:**
- Base Image: `python:3.12-slim`
- Container Name: `careerlab-backend`
- Port Mapping: `8000:8000`
- Network: `careerlab-network`
- Health Check: `curl -f http://localhost:8000/health`

**Key Features:**
- FastAPI application
- Hot-reload enabled in development
- Persistent resume data volume
- Health monitoring
- Auto-restart on failure

**API Endpoints:**
- `/api/extract-text` - Extract text from PDF resume
- `/api/analyze-keywords` - Analyze resume keywords against job
- `/api/optimize-resume` - Optimize resume with AI
- `/health` - Health check endpoint
- `/docs` - Interactive API documentation

### Frontend Service (careerlab-frontend)

**Configuration:**
- Base Image: `nginx:1.25-alpine`
- Build Image: `node:18-alpine`
- Container Name: `careerlab-frontend`
- Port Mapping: `3000:80`
- Network: `careerlab-network`
- Health Check: `wget --spider http://localhost/health`

**Key Features:**
- Multi-stage build (build + serve)
- Nginx reverse proxy for API calls
- React Router support (SPA fallback)
- Gzip compression
- Security headers
- Static file caching

**Routes:**
- `/` - Landing page
- `/app` - Main application
- `/api/*` - Proxied to backend
- `/health` - Health check endpoint

## 🌐 Networking

The application uses a custom bridge network: `careerlab-network`

**Service Discovery:**
- Frontend → Backend: `http://careerlab-backend:8000`
- External → Frontend: `http://localhost:3000`
- External → Backend: `http://localhost:8000`

**API Proxy Configuration:**
The nginx configuration in frontend automatically proxies `/api/*` requests to the backend service.

## 💾 Volumes

**resume-data Volume:**
- Name: `careerlab-resume-data`
- Purpose: Persist uploaded and optimized resume files
- Mount Point: `/app/resume` in backend container

## 🔍 Health Checks

Both services include health checks:

**Backend:**
- Endpoint: `http://localhost:8000/health`
- Interval: 30s
- Timeout: 10s
- Retries: 3

**Frontend:**
- Endpoint: `http://localhost/health`
- Interval: 30s
- Timeout: 10s
- Retries: 3

## 🐛 Troubleshooting

### Services won't start

```bash
# Check Docker daemon
docker info

# Check service logs
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### API connection errors

```bash
# Check if backend is healthy
docker-compose ps

# Check backend logs
docker-compose logs careerlab-backend

# Verify environment variables
docker exec careerlab-backend env | grep API_KEY
```

### Frontend not loading

```bash
# Check nginx configuration
docker exec careerlab-frontend cat /etc/nginx/conf.d/default.conf

# Check frontend logs
docker-compose logs careerlab-frontend

# Rebuild frontend
docker-compose up -d --build careerlab-frontend
```

### Port already in use

```bash
# Find process using port 3000
lsof -i :3000

# Find process using port 8000
lsof -i :8000

# Change ports in docker-compose.yml
# Example: "3001:80" instead of "3000:80"
```

## 🚢 Production Deployment

### Build for production

```bash
# Build with production tag
./docker-build.sh v1.0.0

# Tag for registry
docker tag careerlab-ai/backend:latest your-registry/careerlab-backend:v1.0.0
docker tag careerlab-ai/frontend:latest your-registry/careerlab-frontend:v1.0.0

# Push to registry
docker push your-registry/careerlab-backend:v1.0.0
docker push your-registry/careerlab-frontend:v1.0.0
```

### Environment Configuration

Update `.env` for production:
```env
ENVIRONMENT=production
REACT_APP_API_URL=https://api.careerlab.ai
```

### Security Considerations

1. **Never commit `.env` file** - It contains sensitive API keys
2. **Use secrets management** in production (AWS Secrets Manager, etc.)
3. **Enable HTTPS** - Use reverse proxy (nginx, Caddy)
4. **Update security headers** in nginx.conf
5. **Scan images** for vulnerabilities: `docker scan careerlab-ai/backend`

## 📊 Resource Usage

**Backend Container:**
- Memory: ~200-500MB
- CPU: 0.5-1 core
- Storage: ~500MB (base) + resume files

**Frontend Container:**
- Memory: ~50-100MB
- CPU: 0.1-0.2 core
- Storage: ~150MB

## 🔄 CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Build and Push Docker Images

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build images
        run: ./docker-build.sh ${{ github.ref_name }}
      
      - name: Push to registry
        run: |
          docker push careerlab-ai/backend:${{ github.ref_name }}
          docker push careerlab-ai/frontend:${{ github.ref_name }}
```

## 📝 Notes

- The backend uses **uvicorn with --reload** for development (hot-reload enabled)
- The frontend uses **multi-stage build** to minimize image size
- **nginx** serves the React app and proxies API calls to backend
- All services are connected via **custom bridge network** for internal communication
- **Health checks** ensure services are ready before accepting traffic
- **Volumes** persist resume data across container restarts

## 🆘 Support

For issues specific to your CareerLab AI deployment, check:
1. Service logs: `docker-compose logs -f`
2. Container status: `docker-compose ps`
3. Network connectivity: `docker network inspect careerlab-network`
4. Environment variables: `docker exec careerlab-backend env`

