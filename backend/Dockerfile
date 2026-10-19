# 3Knot Matrimony backend: REST API + WebSocket (/ws) + uploaded photos (/uploads), on port 5000.
# Needs ../shared, so build from the repository root:
#   docker build -f backend/Dockerfile -t 3knot-backend .
# Settings come from the environment (see backend/.env.example); migrations run on start.

FROM node:24-slim AS deps
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM node:24-slim
ENV PORT=5000 \
    UPLOAD_DIR=uploads \
    PRIVATE_UPLOAD_DIR=uploads-private
WORKDIR /app/backend

COPY --from=deps --chown=node:node /app/backend/node_modules ./node_modules
COPY --chown=node:node backend/package.json ./
COPY --chown=node:node backend/src ./src
COPY --chown=node:node shared /app/shared

# Photos and verification selfies: mount volumes here so they survive restarts and rebuilds
RUN mkdir -p uploads uploads-private && chown node:node uploads uploads-private
VOLUME ["/app/backend/uploads", "/app/backend/uploads-private"]

USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 5000) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]
