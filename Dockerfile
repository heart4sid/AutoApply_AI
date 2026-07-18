# ============================================================
# AutoApply AI — Production Multi-Stage Dockerfile
# ============================================================

# ── Build Stage ──
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy root workspace configuration and locks
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies (frozen lockfile)
RUN pnpm install --frozen-lockfile

# Copy codebase
COPY . .

# Build packages and applications
RUN pnpm build

# ── API Runtime Stage ──
FROM node:20-alpine AS api-runner
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app ./
EXPOSE 4000
CMD ["pnpm", "--filter", "@autoapply/api", "start:prod"]

# ── Web Runtime Stage ──
FROM node:20-alpine AS web-runner
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app ./
EXPOSE 3000
CMD ["pnpm", "--filter", "@autoapply/web", "start"]
