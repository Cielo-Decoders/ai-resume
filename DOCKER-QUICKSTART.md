# CareerLab AI - Docker Quick Start Guide

## 🚀 Build and Run Your Docker Images

### Default Build (v1.0.0)
```bash
cd /Users/username/folder1/folder2/ai-resume
./docker-build.sh
```
This creates:
- `careerlab-ai-backend:v1.0.0`
- `careerlab-ai-frontend:v1.0.0`
- `careerlab-ai-backend:latest`
- `careerlab-ai-frontend:latest`

### Build with Custom Version
```bash
./docker-build.sh v1.0.1     # Patch update
./docker-build.sh v1.1.0     # Minor update
./docker-build.sh v2.0.0     # Major update
./docker-build.sh 1.0.0      # Auto adds 'v' prefix → v1.0.0
```

### View Your Images
```bash
# Quick view
./docker-view-images.sh

# Docker Desktop
# 1. Open Docker Desktop
# 2. Click "Images" in sidebar
# 3. Look for "careerlab-ai-backend" and "careerlab-ai-frontend"

# Manual check
docker images | grep careerlab-ai
```

### Run the Application
```bash
./docker-run.sh
```

Access at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

### Image Naming Pattern
```
Format: careerlab-ai-{service}:{version}

Examples:
- careerlab-ai-backend:v1.0.0
- careerlab-ai-backend:v1.0.1
- careerlab-ai-backend:latest
- careerlab-ai-frontend:v1.0.0
- careerlab-ai-frontend:v1.0.1
- careerlab-ai-frontend:latest
```

### Version Numbering Guide
```
v{MAJOR}.{MINOR}.{PATCH}

MAJOR: Breaking changes (v2.0.0)
MINOR: New features, backward compatible (v1.1.0)
PATCH: Bug fixes (v1.0.1)

Examples:
v1.0.0 → Initial release
v1.0.1 → Bug fix
v1.1.0 → Added new feature
v2.0.0 → Major rewrite
```

### Common Commands
```bash
# Build with version
./docker-build.sh v1.0.0

# View all images
./docker-view-images.sh

# Start services
./docker-run.sh

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Remove specific version
docker rmi careerlab-ai-backend:v1.0.0
docker rmi careerlab-ai-frontend:v1.0.0
```

