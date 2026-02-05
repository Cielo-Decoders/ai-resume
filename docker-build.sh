#!/bin/bash

# CareerLab AI - Docker Build Script
# This script builds both frontend and backend Docker images

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for production flag
PRODUCTION=false
if [[ "$1" == "--prod" || "$1" == "-p" ]]; then
    PRODUCTION=true
    shift  # Remove the flag from arguments
fi

# Default version is v1.0.0, can be overridden with argument
if [ -z "$1" ]; then
    if [ "$PRODUCTION" = true ]; then
        VERSION="v1.0.0-prod"
        echo -e "${YELLOW}No version specified, using default: ${VERSION}${NC}"
    else
        VERSION="v1.0.0"
        echo -e "${YELLOW}No version specified, using default: ${VERSION}${NC}"
    fi
else
    # Add 'v' prefix if not present
    if [[ $1 == v* ]]; then
        VERSION=$1
    else
        VERSION="v$1"
    fi
    # Add -prod suffix for production builds
    if [ "$PRODUCTION" = true ]; then
        VERSION="${VERSION}-prod"
    fi
fi

if [ "$PRODUCTION" = true ]; then
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}  CareerLab AI - Production Build${NC}"
    echo -e "${GREEN}  Platform: Vercel (Linux/AMD64)${NC}"
    echo -e "${GREEN}  Version: ${VERSION}${NC}"
    echo -e "${GREEN}======================================${NC}"
else
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}  CareerLab AI - Docker Build${NC}"
    echo -e "${GREEN}  Version: ${VERSION}${NC}"
    echo -e "${GREEN}======================================${NC}"
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found. Copying from .env.example${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}Please update .env with your actual API keys${NC}"
    else
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
fi

# Build backend image
echo -e "\n${BLUE}[1/2] Building backend image...${NC}"

if [ "$PRODUCTION" = true ]; then
    # Production build with platform specification
    docker build \
        -t careerlab-ai-backend:${VERSION} \
        -t careerlab-ai-backend:prod-latest \
        --platform linux/amd64 \
        --build-arg ENVIRONMENT=production \
        -f server/Dockerfile \
        ./server
else
    # Development build
    docker build \
        -t careerlab-ai-backend:${VERSION} \
        -t careerlab-ai-backend:latest \
        -f server/Dockerfile \
        ./server
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend image built successfully${NC}"
    echo -e "  ${BLUE}Image name:${NC} careerlab-ai-backend:${VERSION}"
else
    echo -e "${RED}✗ Backend build failed${NC}"
    exit 1
fi

# Build frontend image
echo -e "\n${BLUE}[2/2] Building frontend image...${NC}"

if [ "$PRODUCTION" = true ]; then
    # Production build with platform specification
    docker build \
        -t careerlab-ai-frontend:${VERSION} \
        -t careerlab-ai-frontend:prod-latest \
        --platform linux/amd64 \
        --build-arg REACT_APP_API_URL=${REACT_APP_API_URL:-https://api.careerlab.ai} \
        --build-arg REACT_APP_OPENAI_API_KEY=${REACT_APP_OPENAI_API_KEY} \
        --build-arg NODE_ENV=production \
        -f client/Dockerfile \
        ./client
else
    # Development build
    docker build \
        -t careerlab-ai-frontend:${VERSION} \
        -t careerlab-ai-frontend:latest \
        --build-arg REACT_APP_API_URL=http://localhost:8000 \
        -f client/Dockerfile \
        ./client
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend image built successfully${NC}"
    echo -e "  ${BLUE}Image name:${NC} careerlab-ai-frontend:${VERSION}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

# Display built images
echo -e "\n${GREEN}======================================${NC}"
echo -e "${GREEN}  Built Images${NC}"
echo -e "${GREEN}======================================${NC}"
docker images | grep -E "REPOSITORY|careerlab-ai"

echo -e "\n${GREEN}Build complete!${NC}"
if [ "$PRODUCTION" = true ]; then
    echo -e "${YELLOW}Production Images created:${NC}"
    echo -e "  ${BLUE}Backend:${NC}  careerlab-ai-backend:${VERSION} & careerlab-ai-backend:prod-latest"
    echo -e "  ${BLUE}Frontend:${NC} careerlab-ai-frontend:${VERSION} & careerlab-ai-frontend:prod-latest"
    echo -e "\n${GREEN}Production Optimizations:${NC}"
    echo -e "  ✓ Platform: linux/amd64 (Vercel-compatible)"
    echo -e "  ✓ Non-root user for security"
    echo -e "  ✓ Multi-worker uvicorn (backend)"
    echo -e "  ✓ Production environment variables"
else
    echo -e "${YELLOW}Images created:${NC}"
    echo -e "  ${BLUE}Backend:${NC}  careerlab-ai-backend:${VERSION} & careerlab-ai-backend:latest"
    echo -e "  ${BLUE}Frontend:${NC} careerlab-ai-frontend:${VERSION} & careerlab-ai-frontend:latest"
fi

echo -e "\n${YELLOW}To view images in Docker Desktop:${NC}"
echo -e "  1. Open Docker Desktop application"
echo -e "  2. Click on 'Images' in the left sidebar"
echo -e "  3. Look for images starting with 'careerlab-ai-'"

echo -e "\n${YELLOW}To view images in terminal:${NC}"
echo -e "  ${BLUE}docker images | grep careerlab-ai${NC}"

echo -e "\n${YELLOW}Build Examples:${NC}"
echo -e "  ${BLUE}./docker-build.sh${NC}              - Development build (v1.0.0)"
echo -e "  ${BLUE}./docker-build.sh v1.0.1${NC}       - Development build with version"
echo -e "  ${BLUE}./docker-build.sh --prod${NC}       - Production build (v1.0.0-prod)"
echo -e "  ${BLUE}./docker-build.sh --prod v1.0.1${NC} - Production build with version (v1.0.1-prod)"
