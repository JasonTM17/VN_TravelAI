import { describe, expect, it, vi } from "vitest";
import { consumeChatStream } from "./chat-stream";

function stream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
}

describe("consumeChatStream", () => {
  it("handles events split across chunks and the final buffer", async () => {
    const onToken = vi.fn();
    const result = await consumeChatStream(
      stream([
        'data: {"type":"meta","conversationId":"c1"}\n\ndata: {"type":"to',
        'ken","text":"Xin"}\n\ndata: {"type":"done","reply":"Xin chào","degraded":false}',
      ]),
      undefined,
      onToken,
    );
    expect(result).toEqual({ conversationId: "c1", reply: "Xin chào", degraded: false });
    expect(onToken).toHaveBeenCalledWith("Xin");
  });

  it("rejects a truncated stream without done", async () => {
    await expect(consumeChatStream(stream(['data: {"type":"token","text":"partial"}\n\n']), undefined, () => {}))
      .rejects.toThrow("before completion");
  });

  it("surfaces server error events", async () => {
    await expect(consumeChatStream(stream(['data: {"type":"error","message":"upstream failed"}\n\n']), undefined, () => {}))
      .rejects.toThrow("upstream failed");
  });
});
