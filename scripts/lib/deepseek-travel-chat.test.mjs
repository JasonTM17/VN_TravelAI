/**
 * Unit tests for shipped DeepSeek chat helpers (no network, no hardcoded LLM prose as pass).
 * Run: node --test scripts/lib/deepseek-travel-chat.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractReplyFromDeepSeek,
  isLegacyTemplateReply,
  buildChatMessages,
  callDeepSeekTravelChat,
  TRAVEL_SYSTEM_PROMPT,
  DEFAULT_DEEPSEEK_MODEL,
} from "./deepseek-travel-chat.mjs";

describe("extractReplyFromDeepSeek", () => {
  it("reads OpenAI-style choices[0].message.content", () => {
    const reply = extractReplyFromDeepSeek({
      choices: [{ message: { role: "assistant", content: "  3 ngày Đà Nẵng: Mỹ Khê, Hội An day-trip.  " } }],
    });
    assert.equal(reply, "3 ngày Đà Nẵng: Mỹ Khê, Hội An day-trip.");
  });

  it("returns empty for missing choices", () => {
    assert.equal(extractReplyFromDeepSeek({}), "");
    assert.equal(extractReplyFromDeepSeek(null), "");
  });

  it("joins array content parts", () => {
    const reply = extractReplyFromDeepSeek({
      choices: [{ message: { content: [{ type: "text", text: "Hello " }, { type: "text", text: "Hội An" }] } }],
    });
    assert.equal(reply, "Hello Hội An");
  });
});

describe("isLegacyTemplateReply", () => {
  it("flags old fixed mock prefixes", () => {
    assert.equal(
      isLegacyTemplateReply(
        'TravelAI Concierge (live): Cảm ơn bạn! Với yêu cầu "x", mình gợi ý',
      ),
      true,
    );
    assert.equal(
      isLegacyTemplateReply('TravelAI Concierge: Cảm ơn bạn! Với yêu cầu "x"'),
      true,
    );
    assert.equal(
      isLegacyTemplateReply("Gợi ý 3 ngày Đà Nẵng: sáng tắm biển Mỹ Khê, chiều Bà Nà."),
      false,
    );
  });
});

describe("buildChatMessages", () => {
  it("includes system persona and user message", () => {
    const msgs = buildChatMessages("khách sạn gần phố cổ Hội An");
    assert.equal(msgs.length, 2);
    assert.equal(msgs[0].role, "system");
    assert.ok(msgs[0].content.includes("TravelAI"));
    assert.ok(TRAVEL_SYSTEM_PROMPT.length > 40);
    assert.equal(msgs[1].role, "user");
    assert.equal(msgs[1].content, "khách sạn gần phố cổ Hội An");
  });
});

describe("callDeepSeekTravelChat (shipped entry with injectable fetch)", () => {
  it("fails closed without API key", async () => {
    const r = await callDeepSeekTravelChat({ apiKey: "", message: "hi" });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.reason, "missing_deepseek_api_key");
  });

  it("maps successful completion through extractReplyFromDeepSeek", async () => {
    const fixture = {
      choices: [
        {
          message: {
            role: "assistant",
            content:
              "Với couple 3 ngày Đà Nẵng ~8 triệu: nghỉ Sơn Trà/Mỹ Khê, 1 ngày Hội An, giữ 15% dự phòng.",
          },
        },
      ],
    };
    let sawAuth = false;
    let sawModel = "";
    const r = await callDeepSeekTravelChat({
      apiKey: "test-key-not-real",
      message: "3 ngày Đà Nẵng budget 8 triệu couple",
      model: DEFAULT_DEEPSEEK_MODEL,
      fetchImpl: async (url, init) => {
        assert.ok(String(url).includes("/chat/completions"));
        sawAuth = String(init.headers.authorization || "").startsWith("Bearer ");
        const body = JSON.parse(init.body);
        sawModel = body.model;
        assert.equal(body.messages[1].content.includes("Đà Nẵng"), true);
        return {
          ok: true,
          status: 200,
          async text() {
            return JSON.stringify(fixture);
          },
        };
      },
    });
    assert.equal(sawAuth, true);
    assert.equal(sawModel, "deepseek-v4-flash");
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.ok(r.reply.includes("Đà Nẵng"));
      assert.ok(r.reply.includes("8 triệu") || r.reply.includes("Hội An"));
      assert.equal(isLegacyTemplateReply(r.reply), false);
    }
  });

  it("returns ok:false on provider HTTP error", async () => {
    const r = await callDeepSeekTravelChat({
      apiKey: "test-key",
      message: "hello",
      fetchImpl: async () => ({
        ok: false,
        status: 401,
        async text() {
          return JSON.stringify({ error: { message: "invalid api key" } });
        },
      }),
    });
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.reason, /deepseek_http_401/);
  });

  it("rejects empty model content as failure (not fake live)", async () => {
    const r = await callDeepSeekTravelChat({
      apiKey: "test-key",
      message: "hello",
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        async text() {
          return JSON.stringify({ choices: [{ message: { content: "" } }] });
        },
      }),
    });
    assert.equal(r.ok, false);
  });
});
