FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --no-frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_IDENTITY_URL=http://localhost:3002
ARG NEXT_PUBLIC_AI_URL=http://localhost:3003
ARG NEXT_PUBLIC_DEFAULT_LOCALE=vi
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_IDENTITY_URL=$NEXT_PUBLIC_IDENTITY_URL
ENV NEXT_PUBLIC_AI_URL=$NEXT_PUBLIC_AI_URL
ENV NEXT_PUBLIC_DEFAULT_LOCALE=$NEXT_PUBLIC_DEFAULT_LOCALE
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=1
RUN pnpm build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN groupadd -g 65532 nonroot && useradd -u 65532 -g 65532 -m nonroot
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./next.config.ts
ARG BUILD_SHA=dev
LABEL org.opencontainers.image.source="https://github.com/JasonTM17/VN_TravelAI"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.revision=$BUILD_SHA
LABEL org.opencontainers.image.title="travelai-web"
USER 65532:65532
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD ["node", "-e", "require('http').get('http://127.0.0.1:3000',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"]
CMD ["node_modules/next/dist/bin/next", "start", "-p", "3000"]
