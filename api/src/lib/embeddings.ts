/**
 * OpenAI-compatible embeddings client (works with OpenAI, Azure OpenAI-compatible, local).
 * Falls back to deterministic bag-of-words hash vector when no API key (demo only).
 */

export type EmbedResult = { ok: true; vector: number[]; dim: number; mode: "api" | "local" } | { ok: false; error: string };

/** Deterministic local embedding for tests / offline (not semantic quality). */
export function localHashEmbed(text: string, dim = 64): number[] {
  const v = new Array(dim).fill(0);
  const tokens = text.toLowerCase().split(/[^a-z0-9à-ỹ]+/i).filter(Boolean);
  for (const t of tokens) {
    let h = 2166136261;
    for (let i = 0; i < t.length; i++) {
      h ^= t.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const idx = Math.abs(h) % dim;
    v[idx] += 1;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

export async function embedText(
  text: string,
  opts?: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    fetchImpl?: typeof fetch;
  },
): Promise<EmbedResult> {
  const apiKey = (opts?.apiKey ?? process.env.EMBEDDING_API_KEY ?? process.env.OPENAI_API_KEY ?? "").trim();
  const baseUrl = (opts?.baseUrl ?? process.env.EMBEDDING_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const model = opts?.model ?? process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";
  const input = text.slice(0, 8000);
  if (!apiKey) {
    const vector = localHashEmbed(input);
    return { ok: true, vector, dim: vector.length, mode: "local" };
  }
  try {
    const fetchImpl = opts?.fetchImpl ?? globalThis.fetch;
    const res = await fetchImpl(`${baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, input }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      return { ok: false, error: `embed_http_${res.status}` };
    }
    const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
    const vector = json.data?.[0]?.embedding;
    if (!Array.isArray(vector) || !vector.length) {
      return { ok: false, error: "embed_empty" };
    }
    return { ok: true, vector, dim: vector.length, mode: "api" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "embed_error" };
  }
}
