/**
 * Smoke chat path against a running TravelAI stack.
 * Exercises shipped AI /v1/chat (auth → webhook → DeepSeek or degrade).
 *
 * Usage:
 *   node scripts/smoke-chat.mjs
 * Env:
 *   BASE_IDENTITY BASE_AI DEMO_USER_EMAIL DEMO_USER_PASSWORD
 *   REQUIRE_LIVE=1  → fail unless degraded:false (needs DEEPSEEK_API_KEY on webhook)
 */
const identity = process.env.BASE_IDENTITY || "http://127.0.0.1:53002";
const ai = process.env.BASE_AI || "http://127.0.0.1:53003";
const email = process.env.DEMO_USER_EMAIL || "demo@travelai.local";
const password = process.env.DEMO_USER_PASSWORD || "DemoTravelAI1!";
const requireLive = process.env.REQUIRE_LIVE === "1" || process.env.REQUIRE_LIVE === "true";

const prompts = [
  "3 ngày Đà Nẵng budget 8 triệu couple",
  "khách sạn gần phố cổ Hội An",
];

async function main() {
  const loginRes = await fetch(`${identity}/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const login = await loginRes.json();
  const token = login?.data?.accessToken;
  if (!loginRes.ok || !token) {
    console.error("FAIL login", loginRes.status);
    process.exit(1);
  }
  console.log("OK login");

  const replies = [];
  for (const message of prompts) {
    const res = await fetch(`${ai}/v1/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });
    const body = await res.json();
    const reply = body?.data?.reply ?? "";
    const degraded = body?.data?.degraded;
    replies.push({ message, reply, degraded, status: res.status });
    const okHttp = res.status === 200;
    const okReply = typeof reply === "string" && reply.length > 20;
    const notLegacy = !String(reply).startsWith("TravelAI Concierge (live):");
    console.log(
      `${okHttp && okReply && notLegacy ? "OK" : "FAIL"} chat status=${res.status} degraded=${degraded} replyLen=${reply.length}`,
    );
    if (!okHttp || !okReply || !notLegacy) process.exit(1);
    if (requireLive && degraded !== false) {
      console.error("FAIL REQUIRE_LIVE but degraded!==false");
      process.exit(1);
    }
  }

  if (requireLive) {
    if (replies[0].reply === replies[1].reply) {
      console.error("FAIL live replies identical for different prompts");
      process.exit(1);
    }
    console.log("OK live DeepSeek chat quality checks");
  } else if (replies.every((r) => r.degraded === true)) {
    console.log("OK degraded offline path (set DEEPSEEK_API_KEY + REQUIRE_LIVE=1 for live)");
  }

  console.log("=== smoke-chat passed ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
