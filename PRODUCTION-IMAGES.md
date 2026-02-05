# CareerLab AI - Production vs Development Images

## ✅ What I've Set Up

I've modified your existing Docker files to support **both development and production builds** using a single set of files. No new Docker files were created - I only updated the existing ones.

## 🏷️ Image Tag Names

### Development Images (Default)
```bash
./docker-build.sh
```
Creates:
- `careerlab-ai-backend:v1.0.0` + `careerlab-ai-backend:latest`
- `careerlab-ai-frontend:v1.0.0` + `careerlab-ai-frontend:latest`

### Production Images (Vercel-Compatible) 
```bash
./docker-build.sh --prod
```
Creates:
- `careerlab-ai-backend:v1.0.0-prod` + `careerlab-ai-backend:prod-latest`
- `careerlab-ai-frontend:v1.0.0-prod` + `careerlab-ai-frontend:prod-latest`

## 🔄 Key Differences

| Feature | Development | Production |
|---------|-------------|------------|
| **Tag Suffix** | None | `-prod` |
| **Platform** | Default | `linux/amd64` (Vercel) |
| **Backend Workers** | 1 (with hot-reload) | 4 (multi-worker) |
| **User** | root | non-root (appuser) |
| **Node ENV** | development | production |
| **Security** | Basic | Enhanced (non-root user) |

## 📋 Updated Files

1. **docker-build.sh** - Added `--prod` flag support
2. **server/Dockerfile** - Added ENVIRONMENT build arg for production mode
3. **client/Dockerfile** - Added production build arguments
4. **client/nginx.conf** - Added production optimizations (gzip, security headers)

## 🚀 Usage Examples

```bash
# Development builds
./docker-build.sh              # v1.0.0
./docker-build.sh v1.0.1       # v1.0.1
./docker-build.sh v2.0.0       # v2.0.0

# Production builds (Vercel-compatible)
./docker-build.sh --prod           # v1.0.0-prod
./docker-build.sh --prod v1.0.1    # v1.0.1-prod
./docker-build.sh -p v2.0.0        # v2.0.0-prod (short flag)
```

## 📊 View Your Images

After building, you'll have separate images for development and production:

```bash
docker images | grep careerlab-ai
```

You'll see:
```
careerlab-ai-backend    v1.0.0-prod    ...  766MB
careerlab-ai-backend    prod-latest    ...  766MB
careerlab-ai-backend    v1.0.0         ...  766MB  
careerlab-ai-backend    latest         ...  766MB
careerlab-ai-frontend   v1.0.0-prod    ...  82MB
careerlab-ai-frontend   prod-latest    ...  82MB
careerlab-ai-frontend   v1.0.0         ...  82MB
careerlab-ai-frontend   latest         ...  82MB
```

## 🐳 Push to Docker Hub

### Development Images
```bash
docker tag careerlab-ai-backend:v1.0.0 YOUR_USERNAME/careerlab-ai-backend:v1.0.0
docker tag careerlab-ai-frontend:v1.0.0 YOUR_USERNAME/careerlab-ai-frontend:v1.0.0

docker push YOUR_USERNAME/careerlab-ai-backend:v1.0.0
docker push YOUR_USERNAME/careerlab-ai-frontend:v1.0.0
```

### Production Images (for Vercel)
```bash
docker tag careerlab-ai-backend:v1.0.0-prod YOUR_USERNAME/careerlab-ai-backend:v1.0.0-prod
docker tag careerlab-ai-frontend:v1.0.0-prod YOUR_USERNAME/careerlab-ai-frontend:v1.0.0-prod

docker push YOUR_USERNAME/careerlab-ai-backend:v1.0.0-prod
docker push YOUR_USERNAME/careerlab-ai-frontend:v1.0.0-prod
```

## ✨ Production Optimizations Included

✅ **Platform**: `linux/amd64` (Vercel requirement)
✅ **Non-root user**: Security best practice
✅ **Multi-worker**: 4 uvicorn workers for backend
✅ **Gzip compression**: Faster frontend delivery
✅ **Security headers**: XSS, Content-Type protection
✅ **Static caching**: 1-year cache for static assets
✅ **Production ENV**: NODE_ENV=production

## 🎯 Next Steps

1. Wait for production build to complete
2. View images in Docker Desktop or run `docker images`
3. Test production images locally (optional)
4. Push to Docker Hub
5. Deploy to Vercel or your chosen platform

## 📝 Notes

- Production images are **Vercel-compatible** (linux/amd64)
- Both sets of images use the **same Dockerfiles**
- The `-prod` suffix makes them easily distinguishable
- Production images have enhanced security and performance

