# ── Stage 1: Build the React app ─────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies (ci is faster and reproducible)
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# Only the backend URL is needed at build time — no API keys baked in
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Replace the default nginx config with our SPA-aware config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from Stage 1
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
