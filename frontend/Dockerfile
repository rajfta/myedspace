FROM node:22-alpine AS build

RUN corepack enable

WORKDIR /app

# Build context is the repo root so pnpm can see the whole workspace.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
COPY packages/types ./packages/types
RUN pnpm install --frozen-lockfile --filter=frontend...

COPY frontend ./frontend
WORKDIR /app/frontend
RUN pnpm run build

FROM nginx:1.27-alpine

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
