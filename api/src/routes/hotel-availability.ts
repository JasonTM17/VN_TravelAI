import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { sendProblem } from "../lib/problem.js";
import { enumerateStayNights } from "../lib/hotel-nights.js";

const qSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/** Public availability calendar for a hotel slug. */
export async function hotelAvailabilityRoutes(app: FastifyInstance) {
  app.get("/v1/hotels/:slug/availability", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const parsed = qSchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      return sendProblem(reply, 400, "Validation error", "start=YYYY-MM-DD required");
    }
    const hotel = await prisma.hotel.findUnique({ where: { slug } });
    if (!hotel) return sendProblem(reply, 404, "Not found", "Hotel not found");
    const start = new Date(parsed.data.start);
    const end = parsed.data.end ? new Date(parsed.data.end) : null;
    const nights = enumerateStayNights(start, end);
    // Lazy-seed night rows without failing on zero inventory
    for (const night of nights) {
      const d = new Date(night + "T00:00:00.000Z");
      const existing = await prisma.hotelNightInventory.findUnique({
        where: { hotelId_night: { hotelId: hotel.id, night: d } },
      });
      if (!existing) {
        await prisma.hotelNightInventory.create({
          data: { hotelId: hotel.id, night: d, roomsLeft: Math.max(0, hotel.roomsLeft) },
        });
      }
    }
    const rows = await prisma.hotelNightInventory.findMany({
      where: {
        hotelId: hotel.id,
        night: {
          gte: new Date(nights[0] + "T00:00:00.000Z"),
          lte: new Date(nights[nights.length - 1] + "T00:00:00.000Z"),
        },
      },
      orderBy: { night: "asc" },
    });
    return {
      success: true,
      data: {
        hotelId: hotel.id,
        slug: hotel.slug,
        nights: rows.map((r) => ({
          night: r.night.toISOString().slice(0, 10),
          roomsLeft: r.roomsLeft,
        })),
        available: rows.length > 0 && rows.every((r) => r.roomsLeft >= 1),
      },
    };
  });
}
