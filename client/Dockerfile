# ── Stage 1: Build the React app ─────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies (ci is faster and reproducible)
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# REACT_APP_* variables must be present at BUILD time — they are baked into
# the JavaScript bundle by Create React App's webpack config.
ARG REACT_APP_API_URL
ARG REACT_APP_OPENAI_API_KEY

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_OPENAI_API_KEY=$REACT_APP_OPENAI_API_KEY

RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Replace the default nginx config with our SPA-aware config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from Stage 1
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
