# Backend Dockerfile for NestJS Application
# Multi-stage build for production optimization

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Debug: List source files
RUN echo "=== Source files ===" && find src -name "*.ts" | head -20

# Build the application with verbose output
RUN npx tsc --listEmittedFiles

# Debug: Show what was built
RUN echo "=== Build output ===" && ls -la dist/ && echo "=== All JS files ===" && find dist -name "*.js" | head -20

# Stage 2: Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Set NODE_ENV
ENV NODE_ENV=production

# Copy package files from builder stage (includes package-lock.json)
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Verify the dist folder was copied
RUN echo "=== Production dist folder ===" && ls -la dist/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the application
CMD ["node", "dist/main.js"]
