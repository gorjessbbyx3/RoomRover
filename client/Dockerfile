# Frontend Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY ./client ./client
COPY ./package*.json ./
RUN cd client && npm install && npm run build

FROM nginx:alpine
COPY --from=builder /app/client/dist /usr/share/nginx/html
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
