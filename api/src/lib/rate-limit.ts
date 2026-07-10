import type Redis from "ioredis";
import type { FastifyReply, FastifyRequest } from "fastify";
import { sendProblem } from "./problem.js";

export type RateLimitOptions = {
  /** Redis key prefix */
  prefix: string;
  /** Max requests per window */
  limit: number;
  /** Window seconds */
  windowSec: number;
};

/**
 * Sliding fixed-window rate limit backed by Redis (shared across pods).
 * Returns true if allowed; sends 429 and returns false if exceeded.
 */
export async function enforceRateLimit(
  redis: Redis | null,
  req: FastifyRequest,
  reply: FastifyReply,
  opts: RateLimitOptions,
): Promise<boolean> {
  if (!redis) return true;
  const actor = req.ip || "unknown";
  const key = `${opts.prefix}:${actor}`;
  try {
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, opts.windowSec);
    if (n > opts.limit) {
      sendProblem(reply, 429, "Too many requests", `Rate limit ${opts.limit}/${opts.windowSec}s exceeded`);
      return false;
    }
    reply.header("x-ratelimit-limit", String(opts.limit));
    reply.header("x-ratelimit-remaining", String(Math.max(0, opts.limit - n)));
    return true;
  } catch {
    // Fail open if Redis is down so catalog still serves
    return true;
  }
}
