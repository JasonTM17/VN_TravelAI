import type { FastifyInstance } from "fastify";
import type { MeiliSearch } from "meilisearch";
import type Redis from "ioredis";
import { prisma } from "../db.js";
import { sendProblem } from "../lib/problem.js";
import { meiliCmpNumber, meiliEqNumber, meiliEqString } from "../lib/meili-filter.js";
import { enforceRateLimit } from "../lib/rate-limit.js";

function pageMeta(page: number, limit: number, total: number) {
  return { page, limit, total };
}

const CATALOG_RL = { prefix: "rl:catalog", limit: 120, windowSec: 60 };

export async function catalogRoutes(
  app: FastifyInstance,
  meili: MeiliSearch,
  redis: Redis | null = null,
) {
  app.get("/v1/destinations", async (req, reply) => {
    if (!(await enforceRateLimit(redis, req, reply, CATALOG_RL))) return;
    const q = req.query as { country?: string; q?: string; page?: string; limit?: string };
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 24)));
    if (q.q) {
      const countryFilter = meiliEqString("countryCode", q.country);
      const result = await meili.index("destinations").search(q.q, {
        filter: countryFilter ?? undefined,
        limit,
        offset: (page - 1) * limit,
      });
      return {
        success: true,
        data: result.hits,
        meta: pageMeta(page, limit, result.estimatedTotalHits ?? result.hits.length),
      };
    }
    const where = q.country ? { countryCode: q.country } : {};
    const [total, rows] = await Promise.all([
      prisma.destination.count({ where }),
      prisma.destination.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { nameEn: "asc" },
      }),
    ]);
    return { success: true, data: rows, meta: pageMeta(page, limit, total) };
  });

  app.get("/v1/destinations/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const row = await prisma.destination.findUnique({ where: { slug } });
    if (!row) return sendProblem(reply, 404, "Not found", "Destination not found");
    return { success: true, data: row };
  });

  app.get("/v1/hotels", async (req, reply) => {
    if (!(await enforceRateLimit(redis, req, reply, CATALOG_RL))) return;
    const q = req.query as {
      destination?: string;
      q?: string;
      minPrice?: string;
      maxPrice?: string;
      stars?: string;
      page?: string;
      limit?: string;
    };
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 24)));

    if (q.q) {
      const filters: string[] = [];
      const destF = meiliEqString("destinationSlug", q.destination);
      const starsF = meiliEqNumber("stars", q.stars);
      const minF = meiliCmpNumber("priceFromVnd", ">=", q.minPrice);
      const maxF = meiliCmpNumber("priceFromVnd", "<=", q.maxPrice);
      if (destF) filters.push(destF);
      if (starsF) filters.push(starsF);
      if (minF) filters.push(minF);
      if (maxF) filters.push(maxF);
      const result = await meili.index("hotels").search(q.q, {
        filter: filters.length ? filters.join(" AND ") : undefined,
        limit,
        offset: (page - 1) * limit,
      });
      return {
        success: true,
        data: result.hits,
        meta: pageMeta(page, limit, result.estimatedTotalHits ?? result.hits.length),
      };
    }

    const where: Record<string, unknown> = {};
    if (q.destination) {
      where.destination = { slug: q.destination };
    }
    if (q.stars) where.stars = Number(q.stars);
    if (q.minPrice || q.maxPrice) {
      where.priceFromVnd = {
        ...(q.minPrice ? { gte: Number(q.minPrice) } : {}),
        ...(q.maxPrice ? { lte: Number(q.maxPrice) } : {}),
      };
    }
    const [total, rows] = await Promise.all([
      prisma.hotel.count({ where }),
      prisma.hotel.findMany({
        where,
        include: { destination: true, reviews: { take: 5, orderBy: { createdAt: "desc" } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { priceFromVnd: "asc" },
      }),
    ]);
    const data = rows.map((h) => ({
      ...h,
      destinationSlug: h.destination.slug,
    }));
    return { success: true, data, meta: pageMeta(page, limit, total) };
  });

  app.get("/v1/hotels/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const row = await prisma.hotel.findUnique({
      where: { slug },
      include: {
        destination: true,
        reviews: { orderBy: { createdAt: "desc" }, take: 20 },
        roomTypes: {
          orderBy: { sortOrder: "asc" },
          include: { ratePlans: { orderBy: { priceVnd: "asc" } } },
        },
      },
    });
    if (!row) return sendProblem(reply, 404, "Not found", "Hotel not found");
    return {
      success: true,
      data: { ...row, destinationSlug: row.destination.slug },
    };
  });

  app.get("/v1/tours", async (req, reply) => {
    if (!(await enforceRateLimit(redis, req, reply, CATALOG_RL))) return;
    const q = req.query as { destination?: string; q?: string; page?: string; limit?: string };
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 24)));
    if (q.q) {
      const destF = meiliEqString("destinationSlug", q.destination);
      const result = await meili.index("tours").search(q.q, {
        filter: destF ?? undefined,
        limit,
        offset: (page - 1) * limit,
      });
      return {
        success: true,
        data: result.hits,
        meta: pageMeta(page, limit, result.estimatedTotalHits ?? result.hits.length),
      };
    }
    const where = q.destination ? { destination: { slug: q.destination } } : {};
    const [total, rows] = await Promise.all([
      prisma.tour.count({ where }),
      prisma.tour.findMany({
        where,
        include: { destination: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { priceFromVnd: "asc" },
      }),
    ]);
    return {
      success: true,
      data: rows.map((t) => ({ ...t, destinationSlug: t.destination.slug })),
      meta: pageMeta(page, limit, total),
    };
  });

  app.get("/v1/tours/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const row = await prisma.tour.findUnique({
      where: { slug },
      include: {
        destination: true,
        reviews: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!row) return sendProblem(reply, 404, "Not found", "Tour not found");
    return {
      success: true,
      data: { ...row, destinationSlug: row.destination.slug },
    };
  });

  app.get("/v1/flights/search", async (req, reply) => {
    const q = req.query as { from?: string; to?: string; date?: string; passengers?: string };
    if (!q.from || !q.to || !q.date) {
      return sendProblem(reply, 400, "Validation error", "from, to, date required");
    }
    const day = new Date(q.date);
    if (Number.isNaN(day.getTime())) {
      return sendProblem(reply, 400, "Validation error", "Invalid date");
    }
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const rows = await prisma.flight.findMany({
      where: {
        fromCode: q.from.toUpperCase(),
        toCode: q.to.toUpperCase(),
        departAt: { gte: day, lt: next },
      },
      orderBy: { priceVnd: "asc" },
      take: 50,
    });
    // If no exact date inventory, return sample routes as mock availability
    const data =
      rows.length > 0
        ? rows
        : (
            await prisma.flight.findMany({
              where: { fromCode: q.from.toUpperCase(), toCode: q.to.toUpperCase() },
              take: 10,
              orderBy: { priceVnd: "asc" },
            })
          ).map((f, i) => {
            const depart = new Date(day);
            depart.setHours(6 + i * 2, 0, 0, 0);
            const arrive = new Date(depart.getTime() + (f.arriveAt.getTime() - f.departAt.getTime()));
            return { ...f, departAt: depart, arriveAt: arrive };
          });

    return {
      success: true,
      data: data.map((f) => ({
        id: f.id,
        airline: f.airline,
        flightNumber: f.flightNumber,
        from: f.fromCode,
        to: f.toCode,
        departAt: f.departAt,
        arriveAt: f.arriveAt,
        priceVnd: f.priceVnd,
        cabin: f.cabin,
      })),
    };
  });

  app.get("/v1/transports", async (req) => {
    const q = req.query as {
      from?: string;
      to?: string;
      mode?: string;
      q?: string;
      page?: string;
      limit?: string;
    };
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(q.limit ?? 20)));
    const where: Record<string, unknown> = {};
    if (q.from) where.fromCode = q.from.toUpperCase();
    if (q.to) where.toCode = q.to.toUpperCase();
    if (q.mode === "bus" || q.mode === "train") where.mode = q.mode;
    if (q.q) {
      where.OR = [
        { fromCity: { contains: q.q, mode: "insensitive" } },
        { toCity: { contains: q.q, mode: "insensitive" } },
        { operator: { contains: q.q, mode: "insensitive" } },
      ];
    }
    const [total, rows] = await Promise.all([
      prisma.transport.count({ where }),
      prisma.transport.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { priceVnd: "asc" },
      }),
    ]);
    return {
      success: true,
      data: rows.map((t) => ({
        id: t.id,
        slug: t.slug,
        operator: t.operator,
        mode: t.mode,
        from: t.fromCode,
        to: t.toCode,
        fromCity: t.fromCity,
        toCity: t.toCity,
        departAt: t.departAt,
        arriveAt: t.arriveAt,
        priceVnd: t.priceVnd,
        durationMin: t.durationMin,
        seatsLeft: t.seatsLeft,
      })),
      meta: pageMeta(page, limit, total),
    };
  });

  app.get("/v1/transports/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const row = await prisma.transport.findUnique({ where: { slug } });
    if (!row) return sendProblem(reply, 404, "Not found", "Transport not found");
    return {
      success: true,
      data: {
        id: row.id,
        slug: row.slug,
        operator: row.operator,
        mode: row.mode,
        from: row.fromCode,
        to: row.toCode,
        fromCity: row.fromCity,
        toCity: row.toCity,
        departAt: row.departAt,
        arriveAt: row.arriveAt,
        priceVnd: row.priceVnd,
        durationMin: row.durationMin,
        seatsLeft: row.seatsLeft,
      },
    };
  });

  app.get("/v1/search", async (req, reply) => {
    if (!(await enforceRateLimit(redis, req, reply, { prefix: "rl:search", limit: 60, windowSec: 60 }))) {
      return;
    }
    const q = req.query as { q?: string };
    if (!q.q?.trim()) {
      return sendProblem(reply, 400, "Validation error", "q required");
    }
    const [destinations, hotels, tours] = await Promise.all([
      meili.index("destinations").search(q.q, { limit: 8 }),
      meili.index("hotels").search(q.q, { limit: 8 }),
      meili.index("tours").search(q.q, { limit: 8 }),
    ]);
    return {
      success: true,
      data: {
        destinations: destinations.hits,
        hotels: hotels.hits,
        tours: tours.hits,
      },
    };
  });

  /** Home promo carousel — active rows from Postgres (not FE hardcode). */
  app.get("/v1/promos", async (req, reply) => {
    if (!(await enforceRateLimit(redis, req, reply, CATALOG_RL))) return;
    const q = req.query as { limit?: string };
    const limit = Math.min(20, Math.max(1, Number(q.limit ?? 12)));
    const rows = await prisma.promo.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
    });
    return { success: true, data: rows, meta: pageMeta(1, limit, rows.length) };
  });
}
