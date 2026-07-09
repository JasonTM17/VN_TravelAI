import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { collectDefaultMetrics, Registry, Counter, Histogram } from "prom-client";
import { loadConfig } from "./config.js";
import { loadKeySlots, toJwks } from "./lib/keys.js";
import { createRedis } from "./redis.js";
import { authRoutes } from "./routes/auth.js";
import { prisma } from "./db.js";
import bcrypt from "bcryptjs";

async function ensureDemoUser(email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;
  await prisma.user.create({
    data: {
      email,
      fullName: "TravelAI Demo",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
}

async function main() {
  const config = loadConfig();
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
    },
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(helmet, { contentSecurityPolicy: false });

  const redis = createRedis(config.REDIS_URL);
  try {
    await redis.connect();
  } catch (err) {
    app.log.warn({ err }, "Redis connect failed — rate limit may be degraded");
  }

  const { primary, secondary } = await loadKeySlots(
    config.JWT_PRIMARY_PRIVATE_KEY,
    config.JWT_SECONDARY_PRIVATE_KEY,
  );
  if (!config.JWT_PRIMARY_PRIVATE_KEY) {
    app.log.warn("JWT_PRIMARY_PRIVATE_KEY empty — generated ephemeral Ed25519 key for this process");
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

  app.get("/healthz", async () => ({ status: "ok", service: "identity" }));
  app.get("/readyz", async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ready", service: "identity" };
    } catch {
      return reply.status(503).send({ status: "not_ready", service: "identity" });
    }
  });
  app.get("/metrics", async (_req, reply) => {
    reply.header("content-type", register.contentType);
    return register.metrics();
  });
  app.get("/.well-known/jwks.json", async () => toJwks(primary, secondary));

  await authRoutes(app, { config, primary, redis });

  try {
    await ensureDemoUser(config.DEMO_USER_EMAIL.toLowerCase(), config.DEMO_USER_PASSWORD);
  } catch (err) {
    app.log.warn({ err }, "Demo user seed skipped (DB may not be migrated yet)");
  }

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  app.log.info(`identity listening on :${config.PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
