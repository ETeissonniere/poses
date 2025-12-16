FROM node:20-slim

# Install git for version control
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Expose Vite dev server port
EXPOSE 5173
