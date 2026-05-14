# syntax=docker/dockerfile:1
# Next.js 16 storefront (production)
FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json ./
RUN npm install

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY next.config.ts tsconfig.json postcss.config.mjs next-env.d.ts ./
COPY app ./app
COPY components ./components
COPY context ./context
COPY lib ./lib
COPY public ./public

# Required at build time for embedded public env (browser)
ARG NEXT_PUBLIC_COMMERCE_PROVIDER=medusa
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_MEDUSA_REGION_ID=
ARG NEXT_PUBLIC_MEDUSA_ADMIN_URL=

ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_COMMERCE_PROVIDER=$NEXT_PUBLIC_COMMERCE_PROVIDER \
    NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL \
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY \
    NEXT_PUBLIC_MEDUSA_REGION_ID=$NEXT_PUBLIC_MEDUSA_REGION_ID \
    NEXT_PUBLIC_MEDUSA_ADMIN_URL=$NEXT_PUBLIC_MEDUSA_ADMIN_URL

RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
