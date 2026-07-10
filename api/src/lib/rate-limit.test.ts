import { describe, expect, it, vi } from "vitest";
import { enforceRateLimit } from "./rate-limit.js";

function mockReply() {
  const headers: Record<string, string> = {};
  const reply = {
    header(k: string, v: string) {
      headers[k] = v;
      return reply;
    },
    code: 200,
    payload: null as unknown,
    status(code: number) {
      reply.code = code;
      return reply;
    },
    send(body: unknown) {
      reply.payload = body;
      return reply;
    },
  };
  return { reply: reply as never, headers };
}

describe("enforceRateLimit", () => {
  it("allows when redis is null", async () => {
    const { reply } = mockReply();
    const ok = await enforceRateLimit(null, { ip: "1.2.3.4" } as never, reply, {
      prefix: "rl:test",
      limit: 2,
      windowSec: 60,
    });
    expect(ok).toBe(true);
  });

  it("blocks after limit on shared redis counter", async () => {
    let n = 0;
    const redis = {
      incr: vi.fn(async () => ++n),
      expire: vi.fn(async () => 1),
    };
    const { reply: r1 } = mockReply();
    const { reply: r2 } = mockReply();
    const { reply: r3 } = mockReply();
    const opts = { prefix: "rl:test", limit: 2, windowSec: 60 };
    expect(await enforceRateLimit(redis as never, { ip: "9.9.9.9" } as never, r1, opts)).toBe(true);
    expect(await enforceRateLimit(redis as never, { ip: "9.9.9.9" } as never, r2, opts)).toBe(true);
    expect(await enforceRateLimit(redis as never, { ip: "9.9.9.9" } as never, r3, opts)).toBe(false);
    expect(redis.incr).toHaveBeenCalledTimes(3);
    expect(redis.expire).toHaveBeenCalledTimes(1);
  });
});
