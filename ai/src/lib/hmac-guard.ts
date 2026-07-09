import type { FastifyReply } from "fastify";
import { verifySignature } from "./hmac.js";

/**
 * Reject requests that fail HMAC-SHA256 verification of the raw body.
 * Used for inbound n8n↔ai signed callbacks and shared by unit tests.
 */
export function requireHmac(
  secret: string,
  rawBody: string,
  signatureHeader: string | undefined,
  reply: Pick<FastifyReply, "status" | "header" | "send">,
): boolean {
  if (!signatureHeader || !verifySignature(secret, rawBody, signatureHeader)) {
    reply
      .status(401)
      .header("content-type", "application/problem+json")
      .send({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Invalid HMAC signature",
      });
    return false;
  }
  return true;
}
