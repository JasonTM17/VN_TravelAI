import type { FastifyReply } from "fastify";

export function sendProblem(
  reply: FastifyReply,
  status: number,
  title: string,
  detail?: string,
  type = "about:blank",
) {
  return reply
    .status(status)
    .header("content-type", "application/problem+json")
    .send({ type, title, status, detail });
}
