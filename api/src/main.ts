import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import Redis from "ioredis";
import { collectDefaultMetrics, Registry, Counter, Histogram } from "prom-client";
import { loadConfig } from "./config.js";
import { prisma } from "./db.js";
import { createMeili, reindexAll } from "./lib/meili.js";
import { createAuthGuard, requireAdmin } from "./lib/auth.js";
import { writeAdminAudit } from "./lib/audit.js";
import { catalogRoutes } from "./routes/catalog.js";
import { bookingRoutes } from "./routes/bookings.js";
import { wishlistRoutes } from "./routes/wishlists.js";
import { itineraryRoutes } from "./routes/itineraries.js";
import { chatHistoryRoutes } from "./routes/chat-history.js";
import { reviewRoutes } from "./routes/reviews.js";
import { metricsAuthorized } from "./lib/metrics-guard.js";

async function main() {
  const config = loadConfig();
  const app = Fastify({ logger: { level: config.LOG_LEVEL } });

  app.addHook("onRequest", async (req, reply) => {
    const incoming = req.headers["x-request-id"];
    const requestId =
      typeof incoming === "string" && incoming.length > 0
        ? incoming
        : `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    (req as { requestId?: string }).requestId = requestId;
    reply.header("x-request-id", requestId);
  });

  const origins = config.CORS_ORIGINS.split(",").map((s) => s.trim());
  await app.register(cors, { origin: origins, credentials: true });
  // JSON API: default-src none; no frame; no unsafe-eval
  await app.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });

  const redis = new Redis(config.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
  try {
    await redis.connect();
  } catch {
    app.log.warn("Redis unavailable — catalog rate limits degraded (fail-open)");
  }

  const register = new Registry();
  collectDefaultMetrics({ register });
  const httpRequests = new Counter({
    name: "http_requests_total",
    help: "Total HTTP requests",
    labelNames: ["method", "route", "status"],
    registers: [register],
  });
  const httpDuration = new Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration",
    labelNames: ["method", "route"],
    registers: [register],
  });

  app.addHook("onResponse", async (req, reply) => {
    const route = req.routeOptions?.url ?? req.url;
    httpRequests.inc({ method: req.method, route, status: String(reply.statusCode) });
    httpDuration.observe({ method: req.method, route }, reply.elapsedTime / 1000);
  });

  app.get("/healthz", async () => ({ status: "ok", service: "api" }));
  app.get("/readyz", async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ready", service: "api" };
    } catch {
      return reply.status(503).send({ status: "not_ready", service: "api" });
    }
  });
  app.get("/metrics", async (req, reply) => {
    const xTok = req.headers["x-metrics-token"];
    if (
      !metricsAuthorized(
        config.METRICS_TOKEN,
        req.headers.authorization,
        typeof xTok === "string" ? xTok : undefined,
      )
    ) {
      return reply.status(401).send({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Metrics token required",
      });
    }
    reply.header("content-type", register.contentType);
    return register.metrics();
  });

  const meili = createMeili(config);
  const requireAuth = createAuthGuard(config);
  const redisOrNull = redis.status === "ready" ? redis : null;

  await catalogRoutes(app, meili, redisOrNull);
  await bookingRoutes(app, requireAuth);
  await wishlistRoutes(app, requireAuth);
  await itineraryRoutes(app, requireAuth);
  await chatHistoryRoutes(app, requireAuth);
  await reviewRoutes(app, requireAuth);

  // Admin reindex: JWT with role=admin; optional X-Admin-Token dual factor when set.
  app.post("/v1/admin/reindex", async (req, reply) => {
    const user = await requireAdmin(requireAuth, req, reply);
    if (!user) return;
    const adminToken = process.env.ADMIN_REINDEX_TOKEN;
    if (adminToken && adminToken.length >= 16) {
      const provided = req.headers["x-admin-token"];
      if (typeof provided !== "string" || provided !== adminToken) {
        return reply.status(403).send({
          type: "about:blank",
          title: "Forbidden",
          status: 403,
          detail: "Admin reindex requires matching X-Admin-Token",
        });
      }
    }
    try {
      const counts = await reindexAll(meili);
      await writeAdminAudit({
        userId: user.id,
        action: "meili.reindex",
        detail: JSON.stringify(counts),
        ip: req.ip,
      });
      return { success: true, data: { reindexed: true, by: user.id, role: user.role, counts } };
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ success: false, error: "reindex failed" });
    }
  });

  app.get("/v1/admin/audit", async (req, reply) => {
    const user = await requireAdmin(requireAuth, req, reply);
    if (!user) return;
    const q = req.query as { limit?: string };
    const limit = Math.min(Math.max(Number(q.limit ?? 20) || 20, 1), 100);
    const rows = await prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return { success: true, data: rows };
  });

  // Reindex soon after boot so expanded seed is searchable (Meili may lag seed).
  setTimeout(() => {
    reindexAll(meili)
      .then((counts) => app.log.info({ counts }, "meili reindex complete"))
      .catch((err) => app.log.warn({ err }, "meili reindex skipped"));
  }, 3_000);

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  app.log.info(`api listening on :${config.PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
