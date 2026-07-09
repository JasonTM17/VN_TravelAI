import { createRemoteJWKSet, jwtVerify } from "jose";
import type { FastifyRequest, FastifyReply } from "fastify";
import type { AppConfig } from "../config.js";
import { sendProblem } from "./problem.js";

export type AuthUser = { id: string; email?: string; name?: string };

export function createAuthGuard(config: AppConfig) {
  const jwks = createRemoteJWKSet(new URL(config.IDENTITY_JWKS_URL));

  return async function requireAuth(
    req: FastifyRequest,
    reply: FastifyReply,
  ): Promise<AuthUser | null> {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      sendProblem(reply, 401, "Unauthorized", "Missing bearer token");
      return null;
    }
    try {
      const { payload } = await jwtVerify(header.slice(7), jwks, {
        issuer: config.IDENTITY_ISSUER,
        audience: config.IDENTITY_AUDIENCE,
      });
      if (!payload.sub) {
        sendProblem(reply, 401, "Unauthorized", "Invalid subject");
        return null;
      }
      return {
        id: payload.sub,
        email: typeof payload.email === "string" ? payload.email : undefined,
        name: typeof payload.name === "string" ? payload.name : undefined,
      };
    } catch {
      sendProblem(reply, 401, "Unauthorized", "Invalid token");
      return null;
    }
  };
}
