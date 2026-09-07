# ==========================================
# Google Cloud Run Production Container
# ==========================================
FROM node:22-slim

WORKDIR /app

# Set production environment defaults
ENV NODE_ENV=production
ENV PORT=8080

# Install dependencies
COPY package.json ./
RUN npm install --include=dev

# Copy application source code
COPY . .

# Build Vite frontend & bundled Express backend server
RUN npm run build

# Expose Cloud Run port
EXPOSE 8080

# Launch compiled backend server
CMD ["node", "dist/server.cjs"]

