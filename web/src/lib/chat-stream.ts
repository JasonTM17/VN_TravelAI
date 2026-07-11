export type ChatStreamResult = { conversationId: string; reply: string; degraded: boolean };

type ChatEvent = {
  type?: string;
  text?: string;
  conversationId?: string;
  reply?: string;
  degraded?: boolean;
  error?: string;
  message?: string;
};

export async function consumeChatStream(
  stream: ReadableStream<Uint8Array>,
  initialConversationId: string | undefined,
  onToken: (text: string) => void,
): Promise<ChatStreamResult> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let conversationId = initialConversationId ?? "";
  let reply = "";
  let degraded = false;
  let completed = false;

  const processEvent = (block: string) => {
    const payload = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!payload) return;
    let event: ChatEvent;
    try {
      event = JSON.parse(payload) as ChatEvent;
    } catch {
      throw new Error("Chat stream returned an invalid event");
    }
    if (event.type === "error") throw new Error(event.error ?? event.message ?? "Chat stream failed");
    if (event.type === "meta" && event.conversationId) conversationId = event.conversationId;
    if (event.type === "token" && event.text) {
      reply += event.text;
      onToken(event.text);
    }
    if (event.type === "done") {
      completed = true;
      if (typeof event.reply === "string") reply = event.reply;
      degraded = Boolean(event.degraded);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? "";
      blocks.forEach(processEvent);
    }
    buffer += decoder.decode();
    if (buffer.trim()) processEvent(buffer);
    if (!completed) throw new Error("Chat stream ended before completion");
    return { conversationId, reply, degraded };
  } finally {
    reader.releaseLock();
  }
}
