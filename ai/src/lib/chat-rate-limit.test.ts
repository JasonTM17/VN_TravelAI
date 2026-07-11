import { describe, expect, it, vi } from "vitest";
import { chatRateLimitExceeded } from "./chat-rate-limit.js";

describe("chatRateLimitExceeded", () => {
  it("sets expiry for a new window", async () => {
    const store = { incr: vi.fn().mockResolvedValue(1), expire: vi.fn().mockResolvedValue(1) };
    await expect(chatRateLimitExceeded(store, "user-1")).resolves.toBe(false);
    expect(store.expire).toHaveBeenCalledWith("rl:ai:chat:user-1", 60);
  });

  it("blocks requests over the shared limit", async () => {
    const store = { incr: vi.fn().mockResolvedValue(21), expire: vi.fn() };
    await expect(chatRateLimitExceeded(store, "user-1")).resolves.toBe(true);
  });

  it("fails open when Redis is unavailable", async () => {
    const store = { incr: vi.fn().mockRejectedValue(new Error("offline")), expire: vi.fn() };
    await expect(chatRateLimitExceeded(store, "user-1")).resolves.toBe(false);
  });
});
