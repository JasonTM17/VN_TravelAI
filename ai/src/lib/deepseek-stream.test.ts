import { afterEach, describe, expect, it, vi } from "vitest";
import type { FastifyReply } from "fastify";
import { streamDeepSeekChat } from "./deepseek-stream.js";

function providerStream(events: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(events.join("")));
      controller.close();
    },
  });
}

function replyHarness() {
  const chunks: string[] = [];
  const raw = {
    destroyed: false,
    writeHead: vi.fn(),
    write: vi.fn((chunk: string) => { chunks.push(chunk); return true; }),
    end: vi.fn(),
  };
  return { reply: { raw } as unknown as FastifyReply, raw, chunks };
}

afterEach(() => vi.unstubAllGlobals());

describe("streamDeepSeekChat", () => {
  it("emits a successful terminal event only after provider DONE", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(providerStream([
      'data: {"choices":[{"delta":{"content":"Xin chào"}}]}\n\n',
      "data: [DONE]\n\n",
    ]), { status: 200 })));
    const harness = replyHarness();
    const result = await streamDeepSeekChat({ apiKey: "key", baseUrl: "https://example.test", model: "model", system: "system", userMessage: "hello", reply: harness.reply, conversationId: "c1" });
    expect(result).toEqual({ ok: true, full: "Xin chào" });
    expect(harness.chunks.join("")).toContain('"degraded":false');
  });

  it("marks a partial provider stream degraded when DONE is missing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(providerStream([
      'data: {"choices":[{"delta":{"content":"partial"}}]}\n\n',
    ]), { status: 200 })));
    const harness = replyHarness();
    await streamDeepSeekChat({ apiKey: "key", baseUrl: "https://example.test", model: "model", system: "system", userMessage: "hello", reply: harness.reply, conversationId: "c1" });
    expect(harness.chunks.join("")).toContain('"degraded":true');
  });

  it("emits an error instead of an empty successful reply", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(providerStream(["data: [DONE]\n\n"]), { status: 200 })));
    const harness = replyHarness();
    await streamDeepSeekChat({ apiKey: "key", baseUrl: "https://example.test", model: "model", system: "system", userMessage: "hello", reply: harness.reply, conversationId: "c1" });
    expect(harness.chunks.join("")).toContain('"type":"error"');
    expect(harness.chunks.join("")).not.toContain('"reply":"","degraded":false');
  });
});
