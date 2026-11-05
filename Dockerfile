# Modern Node 23 Base Image (native TypeScript type-stripping support)
FROM node:23

# Set working directory inside container
WORKDIR /app

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source files (no tsc build step required)
COPY server.ts ./
COPY public ./public

# Expose application port
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run TypeScript directly using Node's native --experimental-strip-types flag
CMD ["node", "--experimental-strip-types", "server.ts"]
