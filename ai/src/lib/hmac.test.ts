import { describe, it, expect, vi } from "vitest";
import { signBody, verifySignature } from "./hmac.js";
import { requireHmac } from "./hmac-guard.js";
import { callN8nWebhook, TRAVEL_CHAT_WEBHOOK_TIMEOUT_MS } from "./n8n.js";
import type { AppConfig } from "../config.js";
import { degradedChatReply, degradedItinerary } from "./degraded.js";

describe("hmac signing/verification (shipped module)", () => {
  it("signs and verifies valid signature", () => {
    const body = JSON.stringify({ hello: "world" });
    const sig = signBody("secret", body);
    expect(verifySignature("secret", body, sig)).toBe(true);
  });

  it("rejects invalid HMAC (wrong secret / tampered body)", () => {
    const body = JSON.stringify({ hello: "world" });
    const sig = signBody("secret", body);
    expect(verifySignature("wrong", body, sig)).toBe(false);
    expect(verifySignature("secret", body + "x", sig)).toBe(false);
  });

  it("requireHmac returns 401 on invalid signature", () => {
    const reply = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      header() {
        return this;
      },
      body: null as unknown,
      send(payload: unknown) {
        this.body = payload;
        return this;
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ok = requireHmac("secret", "{}", "deadbeef", reply as any);
    expect(ok).toBe(false);
    expect(reply.statusCode).toBe(401);
    expect((reply.body as { detail: string }).detail).toMatch(/Invalid HMAC/i);
  });

  it("requireHmac accepts valid signature", () => {
    const body = JSON.stringify({ a: 1 });
    const sig = signBody("secret", body);
    const reply = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      header() {
        return this;
      },
      send() {
        return this;
      },
    };
    // Minimal FastifyReply mock for unit isolation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(requireHmac("secret", body, sig, reply as any)).toBe(true);
    expect(reply.statusCode).toBe(200);
  });
});

describe("n8n client degrade path", () => {
  const baseConfig = {
    NODE_ENV: "test",
    PORT: 3003,
    REDIS_URL: "redis://127.0.0.1:6379",
    N8N_WEBHOOK_BASE_URL: "http://127.0.0.1:1/webhook",
    N8N_HMAC_SECRET: "test_hmac_secret_value",
    AI_DEGRADED_MODE: false,
    API_BASE_URL: "http://127.0.0.1:3001",
    IDENTITY_JWKS_URL: "http://127.0.0.1:3002/.well-known/jwks.json",
    IDENTITY_ISSUER: "https://identity.travelai.local",
    IDENTITY_AUDIENCE: "travelai-web",
    LOG_LEVEL: "silent",
  } as AppConfig;

  it("travel-chat timeout constant outlives DeepSeek webhook (~45s)", () => {
    expect(TRAVEL_CHAT_WEBHOOK_TIMEOUT_MS).toBeGreaterThanOrEqual(50_000);
  });

  it("returns ok:false when n8n is unreachable (no throw)", async () => {
    const result = await callN8nWebhook(baseConfig, "travel-chat", { message: "hi" }, 500);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason.length).toBeGreaterThan(0);
  });

  it("honors explicit timeoutMs on callN8nWebhook (shipped 4th arg used by /v1/chat)", async () => {
    const started = Date.now();
    const result = await callN8nWebhook(baseConfig, "travel-chat", { message: "hi" }, 300);
    const elapsed = Date.now() - started;
    expect(result.ok).toBe(false);
    // Should not wait for the 20s default when a short timeout is passed
    expect(elapsed).toBeLessThan(5_000);
  });

  it("forced degraded mode short-circuits without network", async () => {
    const result = await callN8nWebhook(
      { ...baseConfig, AI_DEGRADED_MODE: true },
      "itinerary-generator",
      { destination: "Hội An" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("forced_degraded");
  });

  it("degraded itinerary still structured for concierge UX", () => {
    const plan = degradedItinerary({
      destination: "Hội An",
      days: 3,
      budgetVnd: 5_000_000,
      style: "couple",
    });
    expect(plan.degraded).toBe(true);
    expect(plan.days).toHaveLength(3);
    expect(plan.estimatedBudgetVnd).toBe(5_000_000);
    const chat = degradedChatReply("3 ngày Hội An");
    expect(chat.degraded).toBe(true);
    expect(chat.reply.length).toBeGreaterThan(20);
  });
});
