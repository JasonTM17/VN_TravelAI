import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { sendProblem } from "../lib/problem.js";
import type { createAuthGuard } from "../lib/auth.js";
import { applyPayment, canTransition, type BookingStatus } from "../lib/booking-state.js";

const createSchema = z.object({
  itemType: z.enum(["hotel", "tour", "flight"]),
  itemId: z.string().uuid(),
  guests: z.number().int().min(1).max(20),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  contactName: z.string().min(1).max(120).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(30).optional(),
});

export async function bookingRoutes(
  app: FastifyInstance,
  requireAuth: ReturnType<typeof createAuthGuard>,
) {
  app.get("/v1/bookings", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const rows = await prisma.booking.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: rows };
  });

  app.post("/v1/bookings", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendProblem(reply, 400, "Validation error", JSON.stringify(parsed.error.flatten()));
    }
    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey || typeof idempotencyKey !== "string") {
      return sendProblem(reply, 400, "Validation error", "Idempotency-Key header required");
    }
    const existing = await prisma.booking.findUnique({ where: { idempotencyKey } });
    if (existing) {
      return reply.status(200).send({ success: true, data: existing });
    }

    const { itemType, itemId, guests, startDate, endDate, contactName, contactEmail, contactPhone } =
      parsed.data;

    let totalVnd = 0;
    let itemSnapshot: object = {};

    if (itemType === "hotel") {
      const hotel = await prisma.hotel.findUnique({ where: { id: itemId } });
      if (!hotel) return sendProblem(reply, 404, "Not found", "Hotel not found");
      const nights =
        endDate && endDate > startDate
          ? Math.max(
              1,
              Math.round(
                (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000,
              ),
            )
          : 1;
      totalVnd = hotel.priceFromVnd * nights * guests;
      itemSnapshot = { type: "hotel", slug: hotel.slug, name: hotel.name, nights };
    } else if (itemType === "tour") {
      const tour = await prisma.tour.findUnique({ where: { id: itemId } });
      if (!tour) return sendProblem(reply, 404, "Not found", "Tour not found");
      totalVnd = tour.priceFromVnd * guests;
      itemSnapshot = { type: "tour", slug: tour.slug, title: tour.titleEn };
    } else {
      const flight = await prisma.flight.findUnique({ where: { id: itemId } });
      if (!flight) return sendProblem(reply, 404, "Not found", "Flight not found");
      totalVnd = flight.priceVnd * guests;
      itemSnapshot = {
        type: "flight",
        flightNumber: flight.flightNumber,
        from: flight.fromCode,
        to: flight.toCode,
      };
    }

    try {
      const booking = await prisma.booking.create({
        data: {
          userId: user.id,
          status: "pending_payment",
          itemType,
          itemId,
          itemSnapshot,
          guests,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          totalVnd,
          contactName: contactName ?? user.name,
          contactEmail: contactEmail ?? user.email,
          contactPhone,
          idempotencyKey,
        },
      });
      return reply.status(201).send({ success: true, data: booking });
    } catch (err) {
      // Concurrent create with same Idempotency-Key
      const code = (err as { code?: string })?.code;
      if (code === "P2002") {
        const again = await prisma.booking.findUnique({ where: { idempotencyKey } });
        if (again) return reply.status(200).send({ success: true, data: again });
      }
      throw err;
    }
  });

  app.post("/v1/bookings/:id/pay", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const body = z
      .object({ outcome: z.enum(["success", "fail"]).default("success") })
      .safeParse(req.body ?? {});
    const outcome = body.success ? body.data.outcome : "success";

    const booking = await prisma.booking.findFirst({ where: { id, userId: user.id } });
    if (!booking) return sendProblem(reply, 404, "Not found", "Booking not found");
    const decision = applyPayment(booking.status, outcome);
    if (!decision.ok) {
      if (decision.reason === "Payment failed") {
        return sendProblem(reply, 402, "Payment failed", "Mock payment declined");
      }
      return sendProblem(reply, 400, "Invalid state", decision.reason);
    }
    if (booking.status === decision.status) {
      return { success: true, data: booking };
    }
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: decision.status },
    });
    return { success: true, data: updated };
  });

  app.post("/v1/bookings/:id/cancel", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const booking = await prisma.booking.findFirst({ where: { id, userId: user.id } });
    if (!booking) return sendProblem(reply, 404, "Not found", "Booking not found");
    if (booking.status === "cancelled") {
      return { success: true, data: booking };
    }
    const from = booking.status as BookingStatus;
    if (!canTransition(from, "cancelled")) {
      return sendProblem(reply, 409, "Conflict", `Cannot cancel booking in status ${booking.status}`);
    }
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "cancelled" },
    });
    return { success: true, data: updated };
  });
}
