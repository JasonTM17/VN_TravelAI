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
import { createLocalJWKSet, jwtVerify, type JSONWebKeySet } from "jose";
import { toJwks } from "../lib/keys.js";
import {
  buildRefreshClearCookie,
  buildRefreshSetCookie,
  resolveRefreshToken,
} from "../lib/refresh-cookie.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(MIN_PASSWORD_LEN).max(MAX_PASSWORD_LEN),
  fullName: z.string().min(1).max(120),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Body refresh optional when httpOnly cookie present. */
const refreshSchema = z.object({
  refreshToken: z.string().min(10).optional(),
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
    secondary: KeySlot;
    redis: Redis;
  },
) {
  const { config, primary, secondary, redis } = deps;
  const jwks = createLocalJWKSet(toJwks(primary, secondary) as unknown as JSONWebKeySet);
  const cookieSecure = config.NODE_ENV === "production";
  const cookieSameSite =
    config.COOKIE_SAMESITE === "Lax" ||
    config.COOKIE_SAMESITE === "None" ||
    config.COOKIE_SAMESITE === "Strict"
      ? config.COOKIE_SAMESITE
      : cookieSecure
        ? ("None" as const)
        : ("Lax" as const);
  const cookieDomain = config.COOKIE_DOMAIN?.trim() || undefined;

  function setRefreshCookie(reply: FastifyReply, refreshRaw: string) {
    reply.header(
      "set-cookie",
      buildRefreshSetCookie(refreshRaw, {
        maxAgeSec: config.REFRESH_TOKEN_TTL_SEC,
        secure: cookieSecure,
        sameSite: cookieSameSite,
        domain: cookieDomain,
      }),
    );
  }

  function clearRefreshCookie(reply: FastifyReply) {
    reply.header(
      "set-cookie",
      buildRefreshClearCookie({
        secure: cookieSecure,
        sameSite: cookieSameSite,
        domain: cookieDomain,
      }),
    );
  }

  async function rateLimitIp(req: FastifyRequest, reply: FastifyReply, prefix: string, limit: number) {
    const rlKey = `${prefix}:${req.ip}`;
    try {
      const hits = await redis.incr(rlKey);
      if (hits === 1) await redis.expire(rlKey, 60);
      if (hits > limit) {
        sendProblem(reply, 429, "Too many requests", "Rate limit exceeded");
        return false;
      }
    } catch {
      // fail-open when Redis unavailable
    }
    return true;
  }

  app.post("/v1/auth/register", async (req, reply) => {
    if (!(await rateLimitIp(req, reply, "rl:register", 10))) return;
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
    setRefreshCookie(reply, refreshRaw);
    return reply.status(201).send({
      success: true,
      data: {
        accessToken,
        /** @deprecated Prefer httpOnly cookie; still returned for backward compat. */
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
    if (!(await rateLimitIp(req, reply, "rl:login", 30))) return;
    const email = parsed.data.email.toLowerCase();

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

    setRefreshCookie(reply, refreshRaw);
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
    const parsed = refreshSchema.safeParse(req.body ?? {});
    const bodyToken = parsed.success ? parsed.data.refreshToken : undefined;
    const cookieHeader = req.headers.cookie;
    const refreshValue = resolveRefreshToken(bodyToken, cookieHeader);
    if (!refreshValue) {
      return sendProblem(reply, 400, "Validation error", "refreshToken required (body or cookie)");
    }
    const tokenHash = hashToken(refreshValue);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      clearRefreshCookie(reply);
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
    setRefreshCookie(reply, refreshRaw);
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
    const body = refreshSchema.safeParse(req.body ?? {});
    const bodyToken = body.success ? body.data.refreshToken : undefined;
    const refreshValue = resolveRefreshToken(bodyToken, req.headers.cookie);
    if (refreshValue) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(refreshValue) },
        data: { revokedAt: new Date() },
      });
    }
    clearRefreshCookie(reply);
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
      // Verify against both primary and secondary JWKS slots (rotation)
      const { payload } = await jwtVerify(token, jwks, {
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
    clearRefreshCookie(reply);
    return {
      success: true,
      data: { changed: true, user: publicUser(user) },
    };
  });
}
