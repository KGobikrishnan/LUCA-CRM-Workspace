# Multi-stage build for React + Vite Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Cache node dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build production bundle
COPY . .
RUN npm run build

# Nginx production stage
FROM nginx:alpine

# Copy custom Nginx configuration with reverse proxy for /api
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled SPA static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
