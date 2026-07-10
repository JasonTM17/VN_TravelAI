/**
 * Local stand-in for n8n webhook base: POST /webhook/travel-chat
 * Verifies X-Signature-SHA256 HMAC and returns non-degraded chat reply.
 * Usage: node scripts/mock-n8n-webhook.mjs [port]
 */
import http from "node:http";
import crypto from "node:crypto";

const port = Number(process.argv[2] || 5678);
const secret = process.env.N8N_HMAC_SECRET || "travelai_n8n_hmac_dev_secret_change_me";

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && (req.url === "/healthz" || req.url === "/")) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "mock-n8n" }));
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
    res.writeHead(401, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "invalid hmac" }));
    return;
  }
  let body = {};
  try {
    body = JSON.parse(raw);
  } catch {
    /* empty */
  }
  const message = String(body.message || "").slice(0, 180);
  const reply = `TravelAI Concierge (live): Cảm ơn bạn! Với yêu cầu "${message}", mình gợi ý ưu tiên Việt Nam theo mùa, đặt khách sạn trung tâm, và giữ 15% ngân sách dự phòng.`;
  res.writeHead(200, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      reply,
      conversationId: body.conversationId || null,
      degraded: false,
    }),
  );
});

server.listen(port, "127.0.0.1", () => {
  console.log(`mock-n8n webhook on http://127.0.0.1:${port}/webhook/travel-chat`);
});
