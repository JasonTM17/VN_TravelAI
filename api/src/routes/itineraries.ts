import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { sendProblem } from "../lib/problem.js";
import type { createAuthGuard } from "../lib/auth.js";

const saveSchema = z.object({
  destination: z.string().min(1),
  days: z.array(z.unknown()),
  estimatedBudgetVnd: z.number().int().nonnegative(),
  hotelSuggestions: z.array(z.unknown()).default([]),
  degraded: z.boolean().optional(),
});

export async function itineraryRoutes(
  app: FastifyInstance,
  requireAuth: ReturnType<typeof createAuthGuard>,
) {
  app.post("/v1/itineraries/persist", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const parsed = saveSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendProblem(reply, 400, "Validation error", JSON.stringify(parsed.error.flatten()));
    }
    const row = await prisma.itinerary.create({
      data: {
        userId: user.id,
        destination: parsed.data.destination,
        daysJson: parsed.data.days as object[],
        estimatedBudgetVnd: parsed.data.estimatedBudgetVnd,
        hotelSuggestions: parsed.data.hotelSuggestions as object[],
        degraded: parsed.data.degraded ?? false,
      },
    });
    return reply.status(201).send({ success: true, data: row });
  });

  app.get("/v1/itineraries/:id", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const row = await prisma.itinerary.findFirst({ where: { id, userId: user.id } });
    if (!row) return sendProblem(reply, 404, "Not found");
    return {
      success: true,
      data: {
        id: row.id,
        destination: row.destination,
        days: row.daysJson,
        estimatedBudgetVnd: row.estimatedBudgetVnd,
        hotelSuggestions: row.hotelSuggestions,
        degraded: row.degraded,
        createdAt: row.createdAt,
      },
    };
  });
}
