# ==========================================
# STAGE 1: Build React Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies first (for docker cache optimization)
COPY frontend/package.json ./
RUN npm install

# Copy source and build
COPY frontend/ ./
RUN npm run build

# ==========================================
# STAGE 2: Set Up Backend & Run Application
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Install backend production dependencies
COPY backend/package.json ./
RUN npm install --only=production

# Copy backend server script
COPY backend/server.js ./

# Copy compiled frontend build into the server's public directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Create directory for persistent JSON database
RUN mkdir -p /data

# Expose port
EXPOSE 3000

# Run the server
CMD ["node", "server.js"]
