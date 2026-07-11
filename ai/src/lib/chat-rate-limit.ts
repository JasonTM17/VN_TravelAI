type RateLimitStore = {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
};

/** Per-user fixed-window limit shared by streamed and non-streamed chat. */
export async function chatRateLimitExceeded(
  store: RateLimitStore,
  userId: string,
  limit = 20,
  windowSeconds = 60,
): Promise<boolean> {
  const key = `rl:ai:chat:${userId}`;
  try {
    const count = await store.incr(key);
    if (count === 1) await store.expire(key, windowSeconds);
    return count > limit;
  } catch {
    // Chat remains available in degraded environments without Redis.
    return false;
  }
}
