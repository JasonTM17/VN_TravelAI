import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";
import type { AppConfig } from "../config.js";
import type { KeySlot } from "../lib/keys.js";
import { hashToken, mintAccessToken, mintRefreshToken } from "../lib/tokens.js";
import { sendProblem } from "../lib/problem.js";
import type Redis from "ioredis";
import { importJWK, jwtVerify } from "jose";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(120),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

function publicUser(u: { id: string; email: string; fullName: string; createdAt: Date }) {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    createdAt: u.createdAt.toISOString(),
  };
}

export async function authRoutes(
  app: FastifyInstance,
  deps: {
    config: AppConfig;
    primary: KeySlot;
    redis: Redis;
  },
) {
  const { config, primary, redis } = deps;

  app.post("/v1/auth/register", async (req, reply) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendProblem(reply, 400, "Validation error", JSON.stringify(parsed.error.flatten()));
    }
    const { email, password, fullName } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return sendProblem(reply, 409, "Conflict", "Email already registered");
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName,
      },
    });
    const { accessToken, expiresIn } = await mintAccessToken(user, primary, config);
    const refreshRaw = mintRefreshToken();
    const expiresAt = new Date(Date.now() + config.REFRESH_TOKEN_TTL_SEC * 1000);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshRaw),
        expiresAt,
      },
    });
    return reply.status(201).send({
      success: true,
      data: {
        accessToken,
        refreshToken: refreshRaw,
        expiresIn,
        user: publicUser(user),
      },
    });
  });

  app.post("/v1/auth/login", async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendProblem(reply, 400, "Validation error", JSON.stringify(parsed.error.flatten()));
    }
    const email = parsed.data.email.toLowerCase();
    const rlKey = `rl:login:${req.ip}`;
    const hits = await redis.incr(rlKey);
    if (hits === 1) await redis.expire(rlKey, 60);
    if (hits > 30) {
      return sendProblem(reply, 429, "Too many requests", "Rate limit exceeded");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendProblem(reply, 401, "Unauthorized", "Invalid credentials");
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return sendProblem(reply, 423, "Locked", `Account locked until ${user.lockedUntil.toISOString()}`);
    }
    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!ok) {
      const failed = user.failedLoginCount + 1;
      const lockedUntil =
        failed >= config.LOCKOUT_THRESHOLD
          ? new Date(Date.now() + config.LOCKOUT_MINUTES * 60_000)
          : null;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: failed,
          lockedUntil,
        },
      });
      if (lockedUntil) {
        return sendProblem(reply, 423, "Locked", "Too many failed attempts");
      }
      return sendProblem(reply, 401, "Unauthorized", "Invalid credentials");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });

    const { accessToken, expiresIn } = await mintAccessToken(user, primary, config);
    const refreshRaw = mintRefreshToken();
    const expiresAt = new Date(Date.now() + config.REFRESH_TOKEN_TTL_SEC * 1000);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshRaw),
        expiresAt,
      },
    });

    return {
      success: true,
      data: {
        accessToken,
        refreshToken: refreshRaw,
        expiresIn,
        user: publicUser(user),
      },
    };
  });

  app.post("/v1/auth/refresh", async (req, reply) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendProblem(reply, 400, "Validation error", "refreshToken required");
    }
    const tokenHash = hashToken(parsed.data.refreshToken);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return sendProblem(reply, 401, "Unauthorized", "Invalid refresh token");
    }
    // Rotate: revoke old, issue new
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    const { accessToken, expiresIn } = await mintAccessToken(stored.user, primary, config);
    const refreshRaw = mintRefreshToken();
    await prisma.refreshToken.create({
      data: {
        userId: stored.userId,
        tokenHash: hashToken(refreshRaw),
        expiresAt: new Date(Date.now() + config.REFRESH_TOKEN_TTL_SEC * 1000),
      },
    });
    return {
      success: true,
      data: {
        accessToken,
        refreshToken: refreshRaw,
        expiresIn,
        user: publicUser(stored.user),
      },
    };
  });

  app.post("/v1/auth/logout", async (req, reply) => {
    const body = refreshSchema.partial().safeParse(req.body ?? {});
    if (body.success && body.data.refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(body.data.refreshToken) },
        data: { revokedAt: new Date() },
      });
    }
    return reply.status(204).send();
  });

  app.get("/v1/auth/me", async (req, reply) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return sendProblem(reply, 401, "Unauthorized", "Missing bearer token");
    }
    const token = header.slice(7);
    try {
      const pub = await importJWK(primary.publicJwk as never, "EdDSA");
      const { payload } = await jwtVerify(token, pub, {
        issuer: config.JWT_ISSUER,
        audience: config.JWT_AUDIENCE,
      });
      const sub = payload.sub;
      if (!sub) return sendProblem(reply, 401, "Unauthorized", "Invalid token subject");
      const user = await prisma.user.findUnique({ where: { id: sub } });
      if (!user) return sendProblem(reply, 401, "Unauthorized", "User not found");
      return { success: true, data: publicUser(user) };
    } catch {
      return sendProblem(reply, 401, "Unauthorized", "Invalid token");
    }
  });
}
