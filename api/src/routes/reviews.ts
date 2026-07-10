import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { sendProblem } from "../lib/problem.js";
import type { createAuthGuard } from "../lib/auth.js";
import { averageRating, isValidReviewTarget } from "../lib/review-rating.js";

const createSchema = z
  .object({
    hotelId: z.string().uuid().optional(),
    tourId: z.string().uuid().optional(),
    rating: z.number().int().min(1).max(5),
    body: z.string().min(3).max(4000),
  })
  .refine((d) => isValidReviewTarget(d.hotelId, d.tourId), {
    message: "Provide exactly one of hotelId or tourId",
  });

export async function reviewRoutes(
  app: FastifyInstance,
  requireAuth: ReturnType<typeof createAuthGuard>,
) {
  app.post("/v1/reviews", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendProblem(reply, 400, "Validation error", JSON.stringify(parsed.error.flatten()));
    }
    const { hotelId, tourId, rating, body } = parsed.data;
    const author =
      (typeof user.name === "string" && user.name.trim()) ||
      (typeof user.email === "string" ? user.email.split("@")[0] : "Guest");

    if (hotelId) {
      const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
      if (!hotel) return sendProblem(reply, 404, "Not found", "Hotel not found");
      const existing = await prisma.review.findFirst({
        where: { userId: user.id, hotelId },
      });
      if (existing) {
        return sendProblem(reply, 409, "Conflict", "You already reviewed this hotel");
      }
    } else if (tourId) {
      const tour = await prisma.tour.findUnique({ where: { id: tourId } });
      if (!tour) return sendProblem(reply, 404, "Not found", "Tour not found");
      const existing = await prisma.review.findFirst({
        where: { userId: user.id, tourId },
      });
      if (existing) {
        return sendProblem(reply, 409, "Conflict", "You already reviewed this tour");
      }
    }

    try {
      const review = await prisma.$transaction(async (tx) => {
        const row = await tx.review.create({
          data: {
            userId: user.id,
            author,
            rating,
            body,
            hotelId: hotelId ?? null,
            tourId: tourId ?? null,
          },
        });
        if (hotelId) {
          const ratings = await tx.review.findMany({
            where: { hotelId },
            select: { rating: true },
          });
          await tx.hotel.update({
            where: { id: hotelId },
            data: { rating: averageRating(ratings.map((r) => r.rating)) },
          });
        }
        return row;
      });
      return reply.status(201).send({ success: true, data: review });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "P2002") {
        return sendProblem(reply, 409, "Conflict", "Duplicate review");
      }
      throw err;
    }
  });
}
