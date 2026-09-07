# ==========================================
# Stage 1: Build Frontend (Node 22 + PNPM)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package descriptors first to leverage Docker layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# Install dependencies (frozen lockfile for consistency)
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build arguments & environment variables
ARG VITE_CONVEX_URL=http://localhost:3210
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL

# Build production bundle
RUN pnpm build

# ==========================================
# Stage 2: Production Web Server (Nginx)
# ==========================================
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built bundle from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
