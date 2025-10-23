# Dockerfile

# -----------------------------
# Stage 1 – Build dependencies
# -----------------------------
FROM node:22-alpine AS builder

# Metadata
LABEL maintainer="Aydin Arif <aarif24@myseneca.ca>"
LABEL description="Fragments Node.js microservice (optimized build)"

# Environment variables
ENV PORT=8080
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

# Create working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the app
COPY . .

# -----------------------------
# Stage 2 – Production runtime
# -----------------------------
FROM node:22-alpine

# Set environment and workdir
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

# Copy built app and dependencies from builder
COPY --from=builder /app /app

# Add non-root user for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose port
EXPOSE 8080

# Start the app
CMD ["npm", "start"]
