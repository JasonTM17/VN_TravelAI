import type { FastifyInstance } from "fastify";
import type { MeiliSearch } from "meilisearch";
import { prisma } from "../db.js";
import { sendProblem } from "../lib/problem.js";

function pageMeta(page: number, limit: number, total: number) {
  return { page, limit, total };
}

export async function catalogRoutes(app: FastifyInstance, meili: MeiliSearch) {
  app.get("/v1/destinations", async (req) => {
    const q = req.query as { country?: string; q?: string; page?: string; limit?: string };
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(q.limit ?? 20)));
    if (q.q) {
      const result = await meili.index("destinations").search(q.q, {
        filter: q.country ? `countryCode = "${q.country}"` : undefined,
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

  app.get("/v1/hotels", async (req) => {
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
    const limit = Math.min(50, Math.max(1, Number(q.limit ?? 20)));

    if (q.q) {
      const filters: string[] = [];
      if (q.destination) filters.push(`destinationSlug = "${q.destination}"`);
      if (q.stars) filters.push(`stars = ${Number(q.stars)}`);
      if (q.minPrice) filters.push(`priceFromVnd >= ${Number(q.minPrice)}`);
      if (q.maxPrice) filters.push(`priceFromVnd <= ${Number(q.maxPrice)}`);
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
      },
    });
    if (!row) return sendProblem(reply, 404, "Not found", "Hotel not found");
    return {
      success: true,
      data: { ...row, destinationSlug: row.destination.slug },
    };
  });

  app.get("/v1/tours", async (req) => {
    const q = req.query as { destination?: string; q?: string; page?: string; limit?: string };
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(q.limit ?? 20)));
    if (q.q) {
      const result = await meili.index("tours").search(q.q, {
        filter: q.destination ? `destinationSlug = "${q.destination}"` : undefined,
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

  app.get("/v1/search", async (req, reply) => {
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
}
