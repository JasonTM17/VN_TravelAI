import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import type { createAuthGuard } from "../lib/auth.js";

export async function notificationRoutes(
  app: FastifyInstance,
  requireAuth: ReturnType<typeof createAuthGuard>,
) {
  app.get("/v1/notifications", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const q = req.query as { limit?: string };
    const limit = Math.min(Math.max(Number(q.limit ?? 30) || 30, 1), 100);
    const rows = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return { success: true, data: rows };
  });
}
