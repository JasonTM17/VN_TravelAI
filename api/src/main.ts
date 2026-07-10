import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { collectDefaultMetrics, Registry, Counter, Histogram } from "prom-client";
import { loadConfig } from "./config.js";
import { prisma } from "./db.js";
import { createMeili, reindexAll } from "./lib/meili.js";
import { createAuthGuard } from "./lib/auth.js";
import { catalogRoutes } from "./routes/catalog.js";
import { bookingRoutes } from "./routes/bookings.js";
import { wishlistRoutes } from "./routes/wishlists.js";
import { itineraryRoutes } from "./routes/itineraries.js";

async function main() {
  const config = loadConfig();
  const app = Fastify({ logger: { level: config.LOG_LEVEL } });

  const origins = config.CORS_ORIGINS.split(",").map((s) => s.trim());
  await app.register(cors, { origin: origins, credentials: true });
  await app.register(helmet, { contentSecurityPolicy: false });

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
  app.get("/metrics", async (_req, reply) => {
    reply.header("content-type", register.contentType);
    return register.metrics();
  });

  const meili = createMeili(config);
  const requireAuth = createAuthGuard(config);

  await catalogRoutes(app, meili);
  await bookingRoutes(app, requireAuth);
  await wishlistRoutes(app, requireAuth);
  await itineraryRoutes(app, requireAuth);

  // Admin reindex: require Bearer JWT (user) AND matching admin token header.
  // Public reindex was an open DoS/abuse surface on Meilisearch.
  app.post("/v1/admin/reindex", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const adminToken = process.env.ADMIN_REINDEX_TOKEN;
    const provided = req.headers["x-admin-token"];
    if (
      !adminToken ||
      typeof provided !== "string" ||
      provided.length < 16 ||
      provided !== adminToken
    ) {
      return reply.status(403).send({
        type: "about:blank",
        title: "Forbidden",
        status: 403,
        detail: "Admin reindex requires X-Admin-Token",
      });
    }
    try {
      await reindexAll(meili);
      return { success: true, data: { reindexed: true, by: user.id } };
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ success: false, error: "reindex failed" });
    }
  });

  // Best-effort reindex on boot (after seed may run externally)
  setTimeout(() => {
    reindexAll(meili).catch((err) => app.log.warn({ err }, "meili reindex skipped"));
  }, 5000);

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  app.log.info(`api listening on :${config.PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
