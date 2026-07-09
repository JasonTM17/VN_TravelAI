import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { sendProblem } from "../lib/problem.js";
import type { createAuthGuard } from "../lib/auth.js";

const addSchema = z.object({
  itemType: z.enum(["hotel", "tour", "destination"]),
  itemId: z.string().uuid(),
});

export async function wishlistRoutes(
  app: FastifyInstance,
  requireAuth: ReturnType<typeof createAuthGuard>,
) {
  app.get("/v1/wishlists", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const rows = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const data = await Promise.all(
      rows.map(async (row) => {
        let title = row.itemId;
        let slug: string | null = null;
        let priceFromVnd: number | null = null;
        let hrefKind: "hotel" | "tour" | "destination" = row.itemType;

        if (row.itemType === "hotel") {
          const h = await prisma.hotel.findUnique({ where: { id: row.itemId } });
          if (h) {
            title = h.name;
            slug = h.slug;
            priceFromVnd = h.priceFromVnd;
          }
        } else if (row.itemType === "tour") {
          const t = await prisma.tour.findUnique({ where: { id: row.itemId } });
          if (t) {
            title = t.titleVi;
            slug = t.slug;
            priceFromVnd = t.priceFromVnd;
          }
        } else if (row.itemType === "destination") {
          const d = await prisma.destination.findUnique({ where: { id: row.itemId } });
          if (d) {
            title = d.nameVi;
            slug = d.slug;
          }
        }

        return {
          id: row.id,
          itemType: row.itemType,
          itemId: row.itemId,
          title,
          slug,
          priceFromVnd,
          hrefKind,
          createdAt: row.createdAt,
        };
      }),
    );

    return { success: true, data };
  });

  app.post("/v1/wishlists", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const parsed = addSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendProblem(reply, 400, "Validation error", JSON.stringify(parsed.error.flatten()));
    }
    const row = await prisma.wishlistItem.upsert({
      where: {
        userId_itemType_itemId: {
          userId: user.id,
          itemType: parsed.data.itemType,
          itemId: parsed.data.itemId,
        },
      },
      create: {
        userId: user.id,
        itemType: parsed.data.itemType,
        itemId: parsed.data.itemId,
      },
      update: {},
    });
    return reply.status(201).send({ success: true, data: row });
  });

  app.delete("/v1/wishlists/:id", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    await prisma.wishlistItem.deleteMany({ where: { id, userId: user.id } });
    return reply.status(204).send();
  });
}
