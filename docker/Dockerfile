# syntax=docker/dockerfile:1
# Multi-stage build for the Next.js monorepo. Build context is the repo root.

# ---- Base -----------------------------------------------------------------
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- Dependencies ---------------------------------------------------------
FROM base AS deps
# Copy only the manifests first so the install layer caches across code edits.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
RUN pnpm install --frozen-lockfile

# ---- Builder --------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Produce the self-contained server bundle consumed by the runner stage.
ENV NEXT_OUTPUT=standalone
RUN pnpm --filter web build

# ---- Runner ---------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# curl is used by the container healthcheck.
RUN apk add --no-cache curl

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# The standalone output mirrors the monorepo layout from the tracing root.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/web/server.js"]
