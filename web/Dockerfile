# 3Knot Matrimony web app: the built React site on nginx (port 8080), forwarding /api, /uploads and the /ws
# WebSocket to the backend container. Needs ../shared, so build from the repository root:
#   docker build -f web/Dockerfile -t 3knot-web .
# BACKEND_URL (default http://backend:5000) is where the backend container is reachable.

FROM node:24-slim AS build
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY shared /app/shared
COPY web ./
RUN npm run build

# Runs as an unprivileged user, so it listens on 8080
FROM nginxinc/nginx-unprivileged:1.27-alpine
ENV BACKEND_URL=http://backend:5000
# nginx fills ${BACKEND_URL} into this template when the container starts
COPY web/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/web/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
