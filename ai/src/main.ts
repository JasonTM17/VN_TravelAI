import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import Redis from "ioredis";
import { z } from "zod";
import { collectDefaultMetrics, Registry, Counter } from "prom-client";
import { loadConfig } from "./config.js";
import { createAuthGuard } from "./lib/auth.js";
import { callN8nWebhook } from "./lib/n8n.js";
import { degradedChatReply, degradedItinerary } from "./lib/degraded.js";
import { requireHmac } from "./lib/hmac-guard.js";

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
});

const itinerarySchema = z.object({
  destination: z.string().min(1).max(120),
  days: z.number().int().min(1).max(21),
  budgetVnd: z.number().int().min(100_000),
  travelers: z.number().int().min(1).max(20).default(2),
  style: z.enum(["couple", "family", "backpacker", "luxury", "foodie"]).optional(),
  notes: z.string().max(2000).optional(),
});

// In-memory itinerary store (also persisted via api when available)
const itineraries = new Map<string, Record<string, unknown>>();

async function main() {
  const config = loadConfig();
  const app = Fastify({ logger: { level: config.LOG_LEVEL } });
  await app.register(cors, { origin: true, credentials: true });
  await app.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  });

  const redis = new Redis(config.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
  try {
    await redis.connect();
  } catch {
    app.log.warn("Redis unavailable for AI rate limits");
  }

  const register = new Registry();
  collectDefaultMetrics({ register });
  const reqCounter = new Counter({
    name: "http_requests_total",
    help: "Total HTTP requests",
    labelNames: ["method", "route", "status"],
    registers: [register],
  });

  app.addHook("onResponse", async (req, reply) => {
    reqCounter.inc({
      method: req.method,
      route: req.routeOptions?.url ?? req.url,
      status: String(reply.statusCode),
    });
  });

  app.get("/healthz", async () => ({ status: "ok", service: "ai" }));
  app.get("/readyz", async () => ({ status: "ready", service: "ai" }));
  app.get("/metrics", async (_req, reply) => {
    reply.header("content-type", register.contentType);
    return register.metrics();
  });

  const requireAuth = createAuthGuard(config);

  // Inbound signed webhook probe (n8n → ai or partner) — rejects invalid HMAC with 401
  app.post("/v1/hooks/n8n-callback", async (req, reply) => {
    const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
    const sig = (req.headers["x-signature-sha256"] as string | undefined) ?? "";
    if (!requireHmac(config.N8N_HMAC_SECRET, raw, sig, reply)) return;
    return { success: true, data: { accepted: true } };
  });

  app.post("/v1/chat", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        type: "about:blank",
        title: "Validation error",
        status: 400,
        detail: parsed.error.flatten(),
      });
    }

    const rlKey = `rl:ai:chat:${user.id}`;
    try {
      const n = await redis.incr(rlKey);
      if (n === 1) await redis.expire(rlKey, 60);
      if (n > 20) {
        return reply.status(429).send({ title: "Too many requests", status: 429 });
      }
    } catch {
      /* ignore redis errors */
    }

    const conversationId = parsed.data.conversationId ?? randomUUID();
    const n8n = await callN8nWebhook<{ reply?: string; message?: string }>(
      config,
      "travel-chat",
      {
        userId: user.id,
        conversationId,
        message: parsed.data.message,
        persona: "TravelAI Concierge",
      },
    );

    if (!n8n.ok) {
      const d = degradedChatReply(parsed.data.message);
      return {
        success: true,
        data: { reply: d.reply, conversationId, degraded: true },
      };
    }

    return {
      success: true,
      data: {
        reply: n8n.data.reply ?? n8n.data.message ?? "Đã nhận yêu cầu của bạn.",
        conversationId,
        degraded: false,
      },
    };
  });

  app.post("/v1/itineraries", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const parsed = itinerarySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        type: "about:blank",
        title: "Validation error",
        status: 400,
        detail: parsed.error.flatten(),
      });
    }

    // Optional catalog hotel link
    let hotelHints: Array<{ slug: string; name: string }> = [];
    try {
      const searchUrl = `${config.API_BASE_URL}/v1/hotels?q=${encodeURIComponent(parsed.data.destination)}&limit=3`;
      const res = await fetch(searchUrl);
      if (res.ok) {
        const json = (await res.json()) as { data?: Array<{ slug: string; name: string }> };
        hotelHints = (json.data ?? []).slice(0, 3).map((h) => ({ slug: h.slug, name: h.name }));
      }
    } catch {
      /* catalog optional */
    }

    const n8n = await callN8nWebhook<Record<string, unknown>>(config, "itinerary-generator", {
      userId: user.id,
      ...parsed.data,
      hotelHints,
      persona: "TravelAI Concierge",
    });

    let itinerary: Record<string, unknown>;
    if (!n8n.ok) {
      itinerary = {
        id: randomUUID(),
        ...degradedItinerary(parsed.data),
        hotelSuggestions: hotelHints.length
          ? hotelHints
          : degradedItinerary(parsed.data).hotelSuggestions,
        createdAt: new Date().toISOString(),
      };
    } else {
      itinerary = {
        id: randomUUID(),
        destination: parsed.data.destination,
        days: n8n.data.days ?? degradedItinerary(parsed.data).days,
        estimatedBudgetVnd: n8n.data.estimatedBudgetVnd ?? parsed.data.budgetVnd,
        hotelSuggestions: n8n.data.hotelSuggestions ?? hotelHints,
        transportTips: n8n.data.transportTips ?? [],
        foodTips: n8n.data.foodTips ?? [],
        degraded: false,
        createdAt: new Date().toISOString(),
      };
    }

    itineraries.set(String(itinerary.id), { ...itinerary, userId: user.id });

    // Best-effort persist to api
    try {
      await fetch(`${config.API_BASE_URL}/v1/itineraries/persist`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: req.headers.authorization ?? "",
        },
        body: JSON.stringify({
          destination: itinerary.destination,
          days: itinerary.days,
          estimatedBudgetVnd: itinerary.estimatedBudgetVnd,
          hotelSuggestions: itinerary.hotelSuggestions,
          degraded: itinerary.degraded,
        }),
      });
    } catch {
      /* optional */
    }

    return reply.status(201).send({ success: true, data: itinerary });
  });

  app.get("/v1/itineraries/:id", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const row = itineraries.get(id);
    if (!row || row.userId !== user.id) {
      return reply.status(404).send({ title: "Not found", status: 404 });
    }
    const { userId: _u, ...data } = row;
    return { success: true, data };
  });

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  app.log.info(`ai listening on :${config.PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
