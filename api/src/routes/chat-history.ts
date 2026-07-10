import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { sendProblem } from "../lib/problem.js";
import type { createAuthGuard } from "../lib/auth.js";

const uuid = z.string().uuid();

const appendSchema = z.object({
  conversationId: uuid.optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1).max(16_000),
        degraded: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(20),
  title: z.string().max(200).optional(),
});

export async function chatHistoryRoutes(
  app: FastifyInstance,
  requireAuth: ReturnType<typeof createAuthGuard>,
) {
  app.get("/v1/chat/conversations", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const q = req.query as { limit?: string };
    const limit = Math.min(Math.max(Number(q.limit ?? 20) || 20, 1), 50);
    const rows = await prisma.chatConversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
    return { success: true, data: rows };
  });

  app.get("/v1/chat/conversations/:id", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    if (!uuid.safeParse(id).success) {
      return sendProblem(reply, 400, "Validation error", "Invalid conversation id");
    }
    const conv = await prisma.chatConversation.findFirst({
      where: { id, userId: user.id },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 100 },
      },
    });
    if (!conv) return sendProblem(reply, 404, "Not found", "Conversation not found");
    return {
      success: true,
      data: {
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messages: conv.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          degraded: m.degraded,
          createdAt: m.createdAt,
        })),
      },
    };
  });

  /** Create or append messages; uses conversationId when provided (AI UUID). */
  app.post("/v1/chat/messages", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const parsed = appendSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendProblem(reply, 400, "Validation error", JSON.stringify(parsed.error.flatten()));
    }
    const { conversationId, messages, title } = parsed.data;

    const conv = await prisma.$transaction(async (tx) => {
      let conversation =
        conversationId != null
          ? await tx.chatConversation.findFirst({
              where: { id: conversationId, userId: user.id },
            })
          : null;

      if (!conversation && conversationId) {
        // First persist for this AI conversation id
        conversation = await tx.chatConversation.create({
          data: {
            id: conversationId,
            userId: user.id,
            title: title ?? messages.find((m) => m.role === "user")?.content.slice(0, 80) ?? null,
          },
        });
      } else if (!conversation) {
        conversation = await tx.chatConversation.create({
          data: {
            userId: user.id,
            title: title ?? messages.find((m) => m.role === "user")?.content.slice(0, 80) ?? null,
          },
        });
      } else if (title) {
        conversation = await tx.chatConversation.update({
          where: { id: conversation.id },
          data: { title },
        });
      }

      await tx.chatMessage.createMany({
        data: messages.map((m) => ({
          conversationId: conversation!.id,
          role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
          content: m.content,
          degraded: m.degraded ?? false,
        })),
      });

      await tx.chatConversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      return conversation;
    });

    return reply.status(201).send({
      success: true,
      data: { conversationId: conv.id },
    });
  });
}
