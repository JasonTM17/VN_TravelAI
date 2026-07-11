import type { FastifyReply } from "fastify";

export async function streamDeepSeekChat(opts: {
  apiKey: string;
  baseUrl: string;
  model: string;
  system: string;
  userMessage: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  reply: FastifyReply;
  conversationId: string;
  signal?: AbortSignal;
}): Promise<{ ok: true; full: string } | { ok: false; reason: string }> {
  const base = opts.baseUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model,
      stream: true,
      temperature: 0.7,
      max_tokens: 900,
      thinking: { type: "disabled" },
      messages: [
        { role: "system", content: opts.system },
        ...(opts.history ?? []).slice(-10).map((message) => ({
          role: message.role,
          content: message.content.slice(0, 2000),
        })),
        { role: "user", content: opts.userMessage.slice(0, 4000) },
      ],
    }),
    signal: opts.signal
      ? AbortSignal.any([opts.signal, AbortSignal.timeout(55_000)])
      : AbortSignal.timeout(55_000),
  });
  if (!res.ok || !res.body) {
    return { ok: false, reason: `deepseek_http_${res.status}` };
  }

  opts.reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  opts.reply.raw.write(
    `data: ${JSON.stringify({ type: "meta", conversationId: opts.conversationId })}\n\n`,
  );

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
  let sawDone = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const data = t.slice(5).trim();
        if (data === "[DONE]") {
          sawDone = true;
          continue;
        }
        try {
          const json = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            full += delta;
            opts.reply.raw.write(`data: ${JSON.stringify({ type: "token", text: delta })}\n\n`);
          }
        } catch {
          /* skip malformed provider event */
        }
      }
    }
  } catch {
    // Headers/tokens may already be sent: finish this stream instead of writing a second response.
    if (!opts.reply.raw.destroyed) {
      const terminal = full.trim()
        ? { type: "done", reply: full, degraded: true }
        : { type: "error", message: "AI stream ended before completion" };
      opts.reply.raw.write(`data: ${JSON.stringify(terminal)}\n\n`);
      opts.reply.raw.end();
    }
    return { ok: true, full };
  }
  if (!sawDone || !full.trim()) {
    const terminal = full.trim()
      ? { type: "done", reply: full, degraded: true }
      : { type: "error", message: "AI stream ended before completion" };
    opts.reply.raw.write(`data: ${JSON.stringify(terminal)}\n\n`);
    opts.reply.raw.end();
    return { ok: true, full };
  }
  opts.reply.raw.write(
    `data: ${JSON.stringify({ type: "done", reply: full, degraded: false })}\n\n`,
  );
  opts.reply.raw.end();
  return { ok: true, full };
}

export function streamTextChunks(
  reply: FastifyReply,
  conversationId: string,
  text: string,
  degraded: boolean,
) {
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  reply.raw.write(`data: ${JSON.stringify({ type: "meta", conversationId })}\n\n`);
  const chunk = 24;
  for (let i = 0; i < text.length; i += chunk) {
    const part = text.slice(i, i + chunk);
    reply.raw.write(`data: ${JSON.stringify({ type: "token", text: part })}\n\n`);
  }
  reply.raw.write(
    `data: ${JSON.stringify({ type: "done", reply: text, degraded })}\n\n`,
  );
  reply.raw.end();
}
