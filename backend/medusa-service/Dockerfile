# syntax=docker/dockerfile:1
# Medusa v2 API + admin (production)
FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY medusa-config.ts tsconfig.json ./
COPY src ./src
COPY instrumentation.ts ./

ENV NODE_ENV=production
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/medusa-config.ts ./medusa-config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/instrumentation.ts ./instrumentation.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/.medusa ./.medusa

EXPOSE 9000
CMD ["npm", "run", "start"]
