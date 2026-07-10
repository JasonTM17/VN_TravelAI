/**
 * Local stand-in for n8n webhook base: POST /webhook/travel-chat
 * Verifies X-Signature-SHA256 HMAC; calls DeepSeek V4 Flash when DEEPSEEK_API_KEY is set.
 * Without a key (or on LLM failure) returns HTTP 503 so the AI service degrades safely.
 *
 * Usage: node scripts/mock-n8n-webhook.mjs [port]
 */
import http from "node:http";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { callDeepSeekTravelChat, DEFAULT_DEEPSEEK_MODEL } from "./lib/deepseek-travel-chat.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] || 5678);
const secret = process.env.N8N_HMAC_SECRET || "travelai_n8n_hmac_dev_secret_change_me";
const deepseekKey = (process.env.DEEPSEEK_API_KEY || "").trim();
const deepseekModel = process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL;
const deepseekBase = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && (req.url === "/healthz" || req.url === "/")) {
    json(res, 200, {
      status: "ok",
      service: "mock-n8n",
      deepseekConfigured: Boolean(deepseekKey),
      model: deepseekModel,
    });
    return;
  }

  if (req.method !== "POST" || !req.url?.includes("travel-chat")) {
    res.writeHead(404);
    res.end("not found");
    return;
  }

  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  const sig = req.headers["x-signature-sha256"] || "";
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (!sig || sig !== expected) {
    json(res, 401, { error: "invalid hmac" });
    return;
  }

  let body = {};
  try {
    body = JSON.parse(raw);
  } catch {
    /* empty */
  }
  const message = String(body.message || "").trim();
  if (!message) {
    json(res, 400, { error: "message required" });
    return;
  }

  if (!deepseekKey) {
    json(res, 503, {
      error: "deepseek_not_configured",
      detail: "Set DEEPSEEK_API_KEY for live TravelAI chat (model deepseek-v4-flash).",
    });
    return;
  }

  const llm = await callDeepSeekTravelChat({
    apiKey: deepseekKey,
    message,
    model: deepseekModel,
    baseUrl: deepseekBase,
    timeoutMs: 45_000,
  });

  if (!llm.ok) {
    json(res, 502, { error: "deepseek_failed", reason: llm.reason });
    return;
  }

  json(res, 200, {
    reply: llm.reply,
    conversationId: body.conversationId || null,
    degraded: false,
    model: llm.model,
    provider: "deepseek",
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(
    `mock-n8n webhook on http://0.0.0.0:${port}/webhook/travel-chat deepseek=${Boolean(deepseekKey)} model=${deepseekModel}`,
  );
  console.log(`helpers: ${join(__dirname, "lib", "deepseek-travel-chat.mjs")}`);
});
