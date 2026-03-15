# ── Base ──
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# ── Dependencies ──
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/server/package.json ./packages/server/
COPY packages/server/prisma ./packages/server/prisma
COPY packages/server/prisma.config.ts ./packages/server/prisma.config.ts
ENV DB_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm install --frozen-lockfile

# ── Build ──
FROM base AS builder
WORKDIR /app
ENV DB_URL="postgresql://dummy:dummy@localhost:5432/dummy"
COPY --from=deps /app ./
COPY packages/server ./packages/server
WORKDIR /app/packages/server
RUN pnpm build

# ── Production ──
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# node_modules from deps (includes @prisma/client-runtime-utils etc.)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules
# Generated prisma client from deps (postinstall ran prisma generate)
COPY --from=deps /app/packages/server/node_modules/.prisma ./packages/server/node_modules/.prisma
# Compiled output
COPY --from=builder /app/packages/server/dist ./packages/server/dist
# Prisma files for db push at startup
COPY packages/server/prisma ./packages/server/prisma
COPY packages/server/prisma.config.ts ./packages/server/prisma.config.ts
COPY packages/server/package.json ./packages/server/
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

RUN chown -R appuser:nodejs /app
USER appuser

WORKDIR /app/packages/server
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
