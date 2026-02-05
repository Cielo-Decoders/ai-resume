#!/bin/bash

# CareerLab AI - Docker Image Viewer
# Quick script to view your Docker images

# Color codes
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  CareerLab AI - Docker Images${NC}"
echo -e "${GREEN}======================================${NC}\n"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Docker is not running${NC}"
    echo -e "Please start Docker Desktop and try again"
    exit 1
fi

# Display all CareerLab images
echo -e "${BLUE}Your CareerLab AI Images:${NC}\n"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | grep -E "REPOSITORY|careerlab-ai"

# Count images
BACKEND_COUNT=$(docker images | grep careerlab-ai-backend | wc -l | xargs)
FRONTEND_COUNT=$(docker images | grep careerlab-ai-frontend | wc -l | xargs)

echo -e "\n${GREEN}Summary:${NC}"
echo -e "  Backend images:  ${YELLOW}${BACKEND_COUNT}${NC}"
echo -e "  Frontend images: ${YELLOW}${FRONTEND_COUNT}${NC}"

echo -e "\n${BLUE}To remove old images:${NC}"
echo -e "  docker rmi careerlab-ai-backend:<tag>"
echo -e "  docker rmi careerlab-ai-frontend:<tag>"

echo -e "\n${BLUE}To remove all CareerLab images:${NC}"
echo -e "  docker rmi \$(docker images -q careerlab-ai-*)"

