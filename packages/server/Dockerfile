# ── Base ──
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# ── Build ──
FROM base AS builder
WORKDIR /app
ENV DB_URL="postgresql://dummy:dummy@localhost:5432/dummy"

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/server ./packages/server
RUN pnpm install --frozen-lockfile
RUN cd packages/server && pnpm build

# ── Production ──
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy everything from builder (node_modules with pnpm symlinks intact)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/server/node_modules ./packages/server/node_modules
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/server/prisma ./packages/server/prisma
COPY --from=builder /app/packages/server/prisma.config.ts ./packages/server/prisma.config.ts
COPY --from=builder /app/packages/server/package.json ./packages/server/
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./

RUN chown -R appuser:nodejs /app
USER appuser

WORKDIR /app/packages/server
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
