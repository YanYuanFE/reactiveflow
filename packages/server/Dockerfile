FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY packages/server/package.json ./packages/server/
# Prisma postinstall needs schema + config to run prisma generate
COPY packages/server/prisma ./packages/server/prisma
COPY packages/server/prisma.config.ts ./packages/server/prisma.config.ts
# Dummy DB_URL for prisma generate during postinstall (not used for actual connection)
ENV DB_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm install --frozen-lockfile

# ── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
ENV DB_URL="postgresql://dummy:dummy@localhost:5432/dummy"
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules
COPY pnpm-workspace.yaml package.json ./
COPY packages/server ./packages/server
WORKDIR /app/packages/server
RUN pnpm build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

# Copy full deps (prisma CLI needed for generate/db push at startup)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/server/package.json ./packages/server/

# Copy prisma schema + config
COPY packages/server/prisma ./packages/server/prisma
COPY packages/server/prisma.config.ts ./packages/server/prisma.config.ts

# Generate prisma client (dummy URL for build, real URL injected at runtime)
ENV DB_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN cd packages/server && npx prisma generate

# Copy compiled output
COPY --from=builder /app/packages/server/dist ./packages/server/dist

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser && \
    chown -R appuser:nodejs /app
USER appuser

WORKDIR /app/packages/server
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
