import { createRemoteJWKSet, jwtVerify } from "jose";
import type { FastifyRequest, FastifyReply } from "fastify";
import type { AppConfig } from "../config.js";

export type AuthUser = { id: string; email?: string };

export function createAuthGuard(config: AppConfig) {
  const jwks = createRemoteJWKSet(new URL(config.IDENTITY_JWKS_URL));
  return async function requireAuth(
    req: FastifyRequest,
    reply: FastifyReply,
  ): Promise<AuthUser | null> {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      reply
        .status(401)
        .header("content-type", "application/problem+json")
        .send({ type: "about:blank", title: "Unauthorized", status: 401 });
      return null;
    }
    try {
      const { payload } = await jwtVerify(header.slice(7), jwks, {
        issuer: config.IDENTITY_ISSUER,
        audience: config.IDENTITY_AUDIENCE,
      });
      if (!payload.sub) {
        reply.status(401).send({ title: "Unauthorized", status: 401 });
        return null;
      }
      return {
        id: payload.sub,
        email: typeof payload.email === "string" ? payload.email : undefined,
      };
    } catch {
      reply
        .status(401)
        .header("content-type", "application/problem+json")
        .send({ type: "about:blank", title: "Unauthorized", status: 401, detail: "Invalid token" });
      return null;
    }
  };
}
