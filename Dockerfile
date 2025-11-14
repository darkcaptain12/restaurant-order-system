# Multi-stage build for production

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install all dependencies
RUN npm run install:all

# Copy source code
COPY . .

# Build client and server
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install only production dependencies for server
RUN cd server && npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/data ./server/data

# Set working directory to server
WORKDIR /app/server

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/menu', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/index.js"]

