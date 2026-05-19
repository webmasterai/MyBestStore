# syntax=docker/dockerfile:1

# Medusa v2 API + Admin production optimized Dockerfile

FROM node:20-bookworm-slim AS base

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
  openssl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*


# Install all dependencies once
FROM base AS deps

ENV NODE_ENV=development

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm npm ci


# Build Medusa
FROM base AS builder

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY medusa-config.ts tsconfig.json ./
COPY instrumentation.ts ./
COPY src ./src

RUN npm run build

# Remove dev dependencies after build
RUN npm prune --omit=dev


# Runtime image
FROM base AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/medusa-config.ts ./medusa-config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/instrumentation.ts ./instrumentation.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/.medusa ./.medusa

EXPOSE 9000

CMD ["npm", "run", "start"]