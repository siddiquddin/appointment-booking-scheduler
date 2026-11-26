FROM node:20-alpine AS base

WORKDIR /app

# Copy manifests first for clean Docker layer caching
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy source code and assign ownership to non-root node user
COPY src ./src
RUN chown -R node:node /app

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]
