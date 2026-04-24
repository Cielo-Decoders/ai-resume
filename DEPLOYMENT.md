# 🚀 Deployment Guide — CareerLab AI

This document covers the exact steps to build Docker images, push them to Docker Hub, and deploy to Google Cloud Run.

---

## 📋 Prerequisites

Make sure the following are installed and authenticated before starting:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — running locally
- [Google Cloud CLI (`gcloud`)](https://cloud.google.com/sdk/docs/install) — authenticated
- Docker Hub account — logged in via `docker login`

### Authenticate (first time only)

```bash
# Log in to Docker Hub
docker login

# Log in to Google Cloud
gcloud auth login

# Set your active GCP project
gcloud config set project YOUR_PROJECT_ID
```

---

## 🏷️ Versioning Convention

Images follow semantic versioning: `v1.0.0`, `v1.1.0`, `v1.2.0`, etc.

| Release | Client Tag | Server Tag |
|---------|------------|------------|
| Initial | v1.0.0 | v1.0.0 |
| ... | ... | ... |
| Latest  | v1.7.0 | v1.7.0 |

> ✅ Always increment the version tag for every new deployment (e.g. `v1.7.0` → `v1.8.0`).

---

## 📦 Docker Hub Repositories

| Service | Docker Hub Repo |
|---------|----------------|
| Client  | `pingmeike/careerlab-ai-client` |
| Server  | `pingmeike/careerlab-ai-server` |

---

## ☁️ Google Cloud Run Services

| Service | URL |
|---------|-----|
| Client  | https://careerlab-ai-client-451162289267.us-central1.run.app |
| Server  | https://careerlab-ai-server-451162289267.us-central1.run.app |

---

## 🔄 Deployment Steps (Every Release)

### Step 1 — Decide the new version tag

Check the last used tag (e.g. `v1.7.0`) and increment it:

```
Current: v1.7.0
New:     v1.8.0   ← replace NEW_VERSION below with this
```

---

### Step 2 — Build the Client Docker Image

The client is a React app served via Nginx. The server URL is baked in at build time.

```bash
cd /Users/isaacnarteh/Desktop/Project1/ai-resume/client

docker build \
  --platform linux/amd64 \
  -t pingmeike/careerlab-ai-client:NEW_VERSION \
  -t pingmeike/careerlab-ai-client:latest \
  --build-arg REACT_APP_API_URL=https://careerlab-ai-server-451162289267.us-central1.run.app \
  .
```

> Replace `NEW_VERSION` with the actual tag, e.g. `v1.8.0`.

---

### Step 3 — Build the Server Docker Image

The server is a Python FastAPI app.

```bash
cd /Users/isaacnarteh/Desktop/Project1/ai-resume/server

docker build \
  --platform linux/amd64 \
  -t pingmeike/careerlab-ai-server:NEW_VERSION \
  -t pingmeike/careerlab-ai-server:latest \
  .
```

---

### Step 4 — Push Client Image to Docker Hub

```bash
docker push pingmeike/careerlab-ai-client:NEW_VERSION
docker push pingmeike/careerlab-ai-client:latest
```

---

### Step 5 — Push Server Image to Docker Hub

```bash
docker push pingmeike/careerlab-ai-server:NEW_VERSION
docker push pingmeike/careerlab-ai-server:latest
```

---

### Step 6 — Deploy Server to Google Cloud Run

```bash
gcloud run deploy careerlab-ai-server \
  --image docker.io/pingmeike/careerlab-ai-server:NEW_VERSION \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

---

### Step 7 — Deploy Client to Google Cloud Run

```bash
gcloud run deploy careerlab-ai-client \
  --image docker.io/pingmeike/careerlab-ai-client:NEW_VERSION \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

---

## ✅ Full Example — Deploying v1.8.0

Below is the complete sequence of commands copy-paste ready (replace `v1.8.0` with the real new version):

```bash
# ── 1. Build client ────────────────────────────────────────────────────────────
cd /Users/isaacnarteh/Desktop/Project1/ai-resume/client

docker build \
  --platform linux/amd64 \
  -t pingmeike/careerlab-ai-client:v1.8.0 \
  -t pingmeike/careerlab-ai-client:latest \
  --build-arg REACT_APP_API_URL=https://careerlab-ai-server-451162289267.us-central1.run.app \
  .

# ── 2. Build server ────────────────────────────────────────────────────────────
cd /Users/isaacnarteh/Desktop/Project1/ai-resume/server

docker build \
  --platform linux/amd64 \
  -t pingmeike/careerlab-ai-server:v1.8.0 \
  -t pingmeike/careerlab-ai-server:latest \
  .

# ── 3. Push client to Docker Hub ───────────────────────────────────────────────
docker push pingmeike/careerlab-ai-client:v1.8.0
docker push pingmeike/careerlab-ai-client:latest

# ── 4. Push server to Docker Hub ───────────────────────────────────────────────
docker push pingmeike/careerlab-ai-server:v1.8.0
docker push pingmeike/careerlab-ai-server:latest

# ── 5. Deploy server to Cloud Run ──────────────────────────────────────────────
gcloud run deploy careerlab-ai-server \
  --image docker.io/pingmeike/careerlab-ai-server:v1.8.0 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080

# ── 6. Deploy client to Cloud Run ──────────────────────────────────────────────
gcloud run deploy careerlab-ai-client \
  --image docker.io/pingmeike/careerlab-ai-client:v1.8.0 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

---

## 🗂️ Project Structure Reference

```
ai-resume/
├── client/
│   ├── Dockerfile          ← React + Nginx multi-stage build
│   ├── nginx.conf          ← SPA-aware Nginx config (serves on port 8080)
│   └── src/                ← React source code
├── server/
│   ├── Dockerfile          ← Python 3.12 slim + tesseract + uvicorn
│   ├── requirements.txt    ← Python dependencies
│   └── main.py             ← FastAPI entrypoint
└── DEPLOYMENT.md           ← This file
```

---

## 🔍 Verify Deployment

After deploying, confirm both services are live:

```bash
# Check Cloud Run services
gcloud run services list --platform managed --region us-central1

# Describe a specific service
gcloud run services describe careerlab-ai-client --region us-central1
gcloud run services describe careerlab-ai-server --region us-central1
```

Or simply open the URLs in a browser:
- **Client:** https://careerlab-ai-client-451162289267.us-central1.run.app
- **Server:** https://careerlab-ai-server-451162289267.us-central1.run.app/docs

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---------|-----|
| `docker: permission denied` | Make sure Docker Desktop is running |
| `unauthorized: authentication required` | Run `docker login` |
| `gcloud: command not found` | Install Google Cloud CLI and run `gcloud init` |
| Cloud Run deploy fails | Check logs: `gcloud run services logs read careerlab-ai-server --region us-central1` |
| Client shows old version | Hard refresh browser (`Cmd+Shift+R`) — nginx `no-cache` header on `index.html` handles this |
| Build fails on Apple Silicon (M1/M2/M3) | Always use `--platform linux/amd64` flag when building |

---

## 📝 Release History

| Date | Version | Notes |
|------|---------|-------|
| 2026-03-15 | v1.6.0 | Previous stable release |
| 2026-03-19 | v1.7.0 | Latest release |

