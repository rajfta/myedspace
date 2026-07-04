FROM node:22-alpine AS build

RUN corepack enable

WORKDIR /app

# Build context is the repo root so pnpm can resolve the workspace.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json
RUN pnpm install --frozen-lockfile --filter=backend...

COPY backend ./backend
WORKDIR /app/backend

# Prisma 7's config loader requires DATABASE_URL even for generate.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" pnpm exec prisma generate
RUN pnpm run build

FROM node:22-alpine AS runtime

RUN corepack enable

WORKDIR /app

# Prod-only install; prisma + tsx stay in "dependencies" for the migrate/seed step.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json
RUN pnpm install --prod --frozen-lockfile --filter=backend...

WORKDIR /app/backend
COPY --from=build /app/backend/dist ./dist
# The seed runs from TS source and imports the generated client's source.
COPY --from=build /app/backend/src/generated ./src/generated
COPY --from=build /app/backend/prisma ./prisma
COPY --from=build /app/backend/prisma.config.ts ./prisma.config.ts

USER node

EXPOSE 4000

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm exec prisma db seed && node dist/main"]
