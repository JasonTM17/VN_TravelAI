/**
 * DeepSeek travel-chat helpers (shipped webhook path).
 * OpenAI-compatible Chat Completions → TravelAI concierge reply.
 */

export const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";

export const TRAVEL_SYSTEM_PROMPT = `You are TravelAI Concierge — a helpful Vietnam & world travel advisor inside the TravelAI marketplace (hotels, tours, destinations, mock flights).

Rules:
- Answer in the same language as the user (Vietnamese or English). Prefer clear, practical Vietnamese when the user writes Vietnamese.
- Be specific: destinations, day structure, budget ranges (VND when relevant), season tips, transport, food.
- Stay travel-relevant. Do not invent payment or live airline inventory; point users to browse TravelAI catalog when helpful.
- Keep replies concise but useful (roughly 80–220 words). Use short paragraphs or bullets when planning.
- Never claim you charged a card or booked a real ticket. Mock booking only.
- If budget/days/travelers are mentioned, use them explicitly in the plan.`;

/**
 * @param {unknown} body - parsed JSON from DeepSeek /chat/completions
 * @returns {string}
 */
export function extractReplyFromDeepSeek(body) {
  if (!body || typeof body !== "object") return "";
  const b = /** @type {Record<string, unknown>} */ (body);
  const choices = b.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const msg = /** @type {Record<string, unknown>} */ (choices[0]?.message ?? {});
    const content = msg.content;
    if (typeof content === "string" && content.trim()) return content.trim();
    if (Array.isArray(content)) {
      const text = content
        .map((part) => {
          if (typeof part === "string") return part;
          if (part && typeof part === "object" && "text" in part) {
            return String(/** @type {{ text?: string }} */ (part).text ?? "");
          }
          return "";
        })
        .join("")
        .trim();
      if (text) return text;
    }
  }
  if (typeof b.reply === "string" && b.reply.trim()) return b.reply.trim();
  if (typeof b.message === "string" && b.message.trim()) return b.message.trim();
  return "";
}

/**
 * Detect old fixed template prefix used before live LLM (must not appear as "live").
 * @param {string} reply
 */
export function isLegacyTemplateReply(reply) {
  const s = String(reply || "");
  return (
    s.startsWith("TravelAI Concierge (live):") ||
    s.startsWith("TravelAI Concierge: Cảm ơn bạn! Với yêu cầu")
  );
}

/**
 * @param {string} userMessage
 * @returns {{ role: string, content: string }[]}
 */
export function buildChatMessages(userMessage) {
  return [
    { role: "system", content: TRAVEL_SYSTEM_PROMPT },
    { role: "user", content: String(userMessage || "").slice(0, 4000) },
  ];
}

/**
 * Call DeepSeek V4 Flash (or configured model) Chat Completions API.
 * @param {{
 *   apiKey: string,
 *   message: string,
 *   baseUrl?: string,
 *   model?: string,
 *   timeoutMs?: number,
 *   fetchImpl?: typeof fetch,
 * }} opts
 * @returns {Promise<{ ok: true, reply: string, model: string } | { ok: false, reason: string }>}
 */
export async function callDeepSeekTravelChat(opts) {
  const apiKey = String(opts.apiKey || "").trim();
  if (!apiKey) {
    return { ok: false, reason: "missing_deepseek_api_key" };
  }
  const baseUrl = (opts.baseUrl || process.env.DEEPSEEK_BASE_URL || DEFAULT_DEEPSEEK_BASE_URL)
    .replace(/\/$/, "");
  const model = opts.model || process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL;
  const timeoutMs = opts.timeoutMs ?? 45_000;
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    return { ok: false, reason: "fetch_unavailable" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: buildChatMessages(opts.message),
        temperature: 0.7,
        max_tokens: 900,
        // V4 Flash defaults thinking ON — disable for fast concierge + reliable content
        thinking: { type: "disabled" },
      }),
      signal: controller.signal,
    });
    const rawText = await res.text();
    let json;
    try {
      json = JSON.parse(rawText);
    } catch {
      return { ok: false, reason: `deepseek_non_json_${res.status}` };
    }
    if (!res.ok) {
      const errMsg =
        (json && (json.error?.message || json.message)) || `status_${res.status}`;
      return { ok: false, reason: `deepseek_http_${res.status}:${String(errMsg).slice(0, 120)}` };
    }
    const reply = extractReplyFromDeepSeek(json);
    if (!reply || isLegacyTemplateReply(reply)) {
      return { ok: false, reason: "deepseek_empty_or_template_reply" };
    }
    return { ok: true, reply, model };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "deepseek_error";
    return { ok: false, reason: msg.includes("abort") ? "deepseek_timeout" : msg };
  } finally {
    clearTimeout(timer);
  }
}
