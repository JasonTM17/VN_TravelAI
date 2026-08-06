FROM node:25-bookworm-slim AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm build && pnpm prune --prod

FROM gcr.io/distroless/nodejs22-debian12 AS runner
WORKDIR /app
ARG BUILD_SHA=dev
LABEL org.opencontainers.image.source="https://github.com/JasonTM17/VN_TravelAI"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.revision=$BUILD_SHA
LABEL org.opencontainers.image.title="travelai-ai"
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
USER 65532:65532
EXPOSE 3003
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s \
  CMD ["/nodejs/bin/node", "-e", "require('http').get('http://127.0.0.1:3003/healthz',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"]
CMD ["dist/main.js"]
