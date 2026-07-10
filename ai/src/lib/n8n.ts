import type { AppConfig } from "../config.js";
import { signBody } from "./hmac.js";

/** Must exceed DeepSeek webhook wall-clock (~45s) so AI does not abort first. */
export const TRAVEL_CHAT_WEBHOOK_TIMEOUT_MS = 55_000;

export async function callN8nWebhook<T>(
  config: AppConfig,
  path: string,
  payload: unknown,
  timeoutMs = 20_000,
): Promise<{ ok: true; data: T } | { ok: false; reason: string }> {
  if (config.AI_DEGRADED_MODE) {
    return { ok: false, reason: "forced_degraded" };
  }
  const url = `${config.N8N_WEBHOOK_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const rawBody = JSON.stringify(payload);
  const signature = signBody(config.N8N_HMAC_SECRET, rawBody);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-signature-sha256": signature,
      },
      body: rawBody,
      signal: controller.signal,
    });
    if (!res.ok) {
      return { ok: false, reason: `n8n_status_${res.status}` };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "n8n_error" };
  } finally {
    clearTimeout(timer);
  }
}
