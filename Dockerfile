# Dockerfile
# -----------------------------
# Stage 1 – Build dependencies
# -----------------------------
FROM node:22-alpine AS builder

LABEL maintainer="Aydin Arif <aarif24@myseneca.ca>"
LABEL description="Fragments Node.js microservice (optimized build)"

# DO NOT hardcode PORT here — let ECS control it
# Removed: ENV PORT=8080

ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

COPY . .

# -----------------------------
# Stage 2 – Production runtime
# -----------------------------
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app /app

# Add non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose nothing — ECS ignores this anyway in Fargate
# EXPOSE 8080 → removed (not needed)

CMD ["npm", "start"]
