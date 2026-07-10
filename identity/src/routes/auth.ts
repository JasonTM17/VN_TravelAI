import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";
import type { AppConfig } from "../config.js";
import type { KeySlot } from "../lib/keys.js";
import { hashToken, mintAccessToken, mintRefreshToken } from "../lib/tokens.js";
import { sendProblem } from "../lib/problem.js";
import { MAX_PASSWORD_LEN, MIN_PASSWORD_LEN, validatePasswordChange } from "../lib/password-policy.js";
import type Redis from "ioredis";
import { importJWK, jwtVerify } from "jose";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(MIN_PASSWORD_LEN).max(MAX_PASSWORD_LEN),
  fullName: z.string().min(1).max(120),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(MIN_PASSWORD_LEN).max(MAX_PASSWORD_LEN),
});

function publicUser(u: { id: string; email: string; fullName: string; role?: string; createdAt: Date }) {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role ?? "user",
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

  async function requireUserFromBearer(req: FastifyRequest, reply: FastifyReply) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      sendProblem(reply, 401, "Unauthorized", "Missing bearer token");
      return null;
    }
    const token = header.slice(7);
    try {
      const pub = await importJWK(primary.publicJwk as never, "EdDSA");
      const { payload } = await jwtVerify(token, pub, {
        issuer: config.JWT_ISSUER,
        audience: config.JWT_AUDIENCE,
      });
      const sub = payload.sub;
      if (!sub) {
        sendProblem(reply, 401, "Unauthorized", "Invalid token subject");
        return null;
      }
      const user = await prisma.user.findUnique({ where: { id: sub } });
      if (!user) {
        sendProblem(reply, 401, "Unauthorized", "User not found");
        return null;
      }
      return user;
    } catch {
      sendProblem(reply, 401, "Unauthorized", "Invalid token");
      return null;
    }
  }

  app.get("/v1/auth/me", async (req, reply) => {
    const user = await requireUserFromBearer(req, reply);
    if (!user) return;
    return { success: true, data: publicUser(user) };
  });

  /**
   * Change password for authenticated user.
   * Verifies current password, hashes new one, revokes all refresh tokens.
   */
  app.post("/v1/auth/change-password", async (req, reply) => {
    const user = await requireUserFromBearer(req, reply);
    if (!user) return;
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendProblem(reply, 400, "Validation error", JSON.stringify(parsed.error.flatten()));
    }
    const policy = validatePasswordChange(parsed.data);
    if (!policy.ok) {
      return sendProblem(reply, 400, "Validation error", policy.reason);
    }
    const match = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!match) {
      return sendProblem(reply, 401, "Unauthorized", "Current password is incorrect");
    }
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
    });
    // Force re-login on other devices
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return {
      success: true,
      data: { changed: true, user: publicUser(user) },
    };
  });
}
