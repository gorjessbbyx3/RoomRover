# Backend Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY ./server ./server
COPY ./package*.json ./
RUN cd server && npm install && npm run build || echo "No build step"

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/server /app
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1
CMD ["node", "index.js"]
