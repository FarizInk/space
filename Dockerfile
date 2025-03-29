FROM oven/bun AS builder

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY . .

RUN cd frontend && bun install --frozen-lockfile && bun run build

# Runtime stage
FROM oven/bun AS runtime

# Set working directory
WORKDIR /app

# Install Python for node-gyp
RUN apt update && apt install -y python3 python3-pip

# Install cron
RUN apt-get update && apt-get install -y cron && rm -rf /var/lib/apt/lists/*

# Copy all files except frontend directory
COPY . .

# Remove frontend folder to avoid copying it entirely
RUN rm -rf frontend

# Copy only the built dist folder from builder stage
COPY --from=builder /app/frontend/dist frontend/dist

# Install dependencies
RUN bun install --frozen-lockfile

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"]