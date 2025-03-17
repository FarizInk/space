# Use a Bun base image
FROM oven/bun:latest

# Set working directory
WORKDIR /app

# Copy package.json, bun.lockb, and install dependencies
COPY package.json bun.lockb ./
RUN bun install

# Copy the rest of the app
COPY . .

# Build the SvelteKit app
RUN bun run build

# Expose port 3000
EXPOSE 3000

# Run the app in production mode
CMD ["bun", "run", "preview"]
