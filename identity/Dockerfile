# identity — multi-stage, non-root
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY prisma ./prisma
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm prisma generate && pnpm build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd -g 65532 nonroot \
  && useradd -u 65532 -g 65532 -m nonroot
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh
ARG BUILD_SHA=dev
LABEL org.opencontainers.image.source="https://github.com/JasonTM17/VN_TravelAI"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.revision=$BUILD_SHA
LABEL org.opencontainers.image.title="travelai-identity"
USER 65532:65532
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
  CMD ["node", "-e", "require('http').get('http://127.0.0.1:3002/healthz',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"]
ENTRYPOINT ["./docker-entrypoint.sh"]
