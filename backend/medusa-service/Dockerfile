# syntax=docker/dockerfile:1
# Medusa v2 production: build at /app, run from /app/.medusa/server (compiled medusa-config.js)

FROM node:20-bookworm-slim AS base

WORKDIR /app

ENV NODE_ENV=production
ENV npm_config_audit=false
ENV npm_config_fund=false
ENV npm_config_progress=false

RUN apt-get update && apt-get install -y --no-install-recommends \
  openssl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

ENV NODE_ENV=development

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund --prefer-offline

FROM base AS builder

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY medusa-config.ts tsconfig.json ./
COPY instrumentation.ts ./
COPY src ./src

RUN npm run build

FROM base AS runner

ENV NODE_ENV=production

WORKDIR /app/.medusa/server

COPY --from=builder /app/.medusa/server ./

RUN --mount=type=cache,target=/root/.npm npm install --omit=dev --no-audit --no-fund --prefer-offline

EXPOSE 9000

CMD ["npm", "run", "start"]
