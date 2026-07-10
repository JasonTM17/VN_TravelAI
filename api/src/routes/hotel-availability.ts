import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { sendProblem } from "../lib/problem.js";
import { enumerateStayNights } from "../lib/hotel-nights.js";

const qSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  roomTypeId: z.string().uuid().optional(),
});

/** Public availability calendar for a hotel slug (optional room type). */
export async function hotelAvailabilityRoutes(app: FastifyInstance) {
  app.get("/v1/hotels/:slug/availability", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const parsed = qSchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      return sendProblem(reply, 400, "Validation error", "start=YYYY-MM-DD required");
    }
    const hotel = await prisma.hotel.findUnique({
      where: { slug },
      include: {
        roomTypes: {
          orderBy: { sortOrder: "asc" },
          include: { ratePlans: { orderBy: { priceVnd: "asc" } } },
        },
      },
    });
    if (!hotel) return sendProblem(reply, 404, "Not found", "Hotel not found");

    let roomTypeId = parsed.data.roomTypeId ?? null;
    let defaultRooms = hotel.roomsLeft;
    if (roomTypeId) {
      const rt = hotel.roomTypes.find((r) => r.id === roomTypeId);
      if (!rt) return sendProblem(reply, 400, "Validation error", "Invalid roomTypeId");
      defaultRooms = rt.roomsTotal;
    } else if (hotel.roomTypes[0]) {
      roomTypeId = hotel.roomTypes[0].id;
      defaultRooms = hotel.roomTypes[0].roomsTotal;
    }

    const start = new Date(parsed.data.start);
    const end = parsed.data.end ? new Date(parsed.data.end) : null;
    const nights = enumerateStayNights(start, end);
    for (const night of nights) {
      const d = new Date(night + "T00:00:00.000Z");
      const existing = await prisma.hotelNightInventory.findFirst({
        where: { hotelId: hotel.id, night: d, roomTypeId },
      });
      if (!existing) {
        await prisma.hotelNightInventory.create({
          data: {
            hotelId: hotel.id,
            roomTypeId,
            night: d,
            roomsLeft: Math.max(0, defaultRooms),
          },
        });
      }
    }
    const rows = await prisma.hotelNightInventory.findMany({
      where: {
        hotelId: hotel.id,
        roomTypeId,
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
        roomTypeId,
        roomTypes: hotel.roomTypes.map((rt) => ({
          id: rt.id,
          code: rt.code,
          nameEn: rt.nameEn,
          nameVi: rt.nameVi,
          maxOccupancy: rt.maxOccupancy,
          roomsTotal: rt.roomsTotal,
          basePriceVnd: rt.basePriceVnd,
          ratePlans: rt.ratePlans.map((rp) => ({
            id: rp.id,
            code: rp.code,
            nameEn: rp.nameEn,
            nameVi: rp.nameVi,
            priceVnd: rp.priceVnd,
            breakfastIncluded: rp.breakfastIncluded,
            refundable: rp.refundable,
          })),
        })),
        nights: rows.map((r) => ({
          night: r.night.toISOString().slice(0, 10),
          roomsLeft: r.roomsLeft,
        })),
        available: rows.length > 0 && rows.every((r) => r.roomsLeft >= 1),
      },
    };
  });
}
