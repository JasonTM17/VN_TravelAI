/**
 * Lightweight RAG: retrieve Meilisearch/catalog hits via public search API
 * and format as LLM context (no vector DB).
 */

/**
 * @param {string} query
 * @param {{ apiBaseUrl: string, fetchImpl?: typeof fetch, limit?: number, timeoutMs?: number }} opts
 * @returns {Promise<{ ok: true, context: string, hitCount: number } | { ok: false, reason: string }>}
 */
export async function retrieveCatalogContext(query, opts) {
  const base = String(opts.apiBaseUrl || "").replace(/\/$/, "");
  if (!base) return { ok: false, reason: "missing_api_base" };
  const q = String(query || "").trim().slice(0, 120);
  if (!q) return { ok: false, reason: "empty_query" };
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  const limit = opts.limit ?? 5;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 5000);
  try {
    const url = `${base}/v1/search?q=${encodeURIComponent(q)}`;
    const res = await fetchImpl(url, { signal: controller.signal, headers: { accept: "application/json" } });
    if (!res.ok) return { ok: false, reason: `search_http_${res.status}` };
    const json = await res.json();
    const data = json?.data ?? json;
    const lines = [];
    const pushHits = (arr, label) => {
      if (!Array.isArray(arr)) return;
      for (const item of arr.slice(0, limit)) {
        const name = item.name ?? item.titleEn ?? item.titleVi ?? item.slug ?? item.id;
        const slug = item.slug ? ` (${item.slug})` : "";
        const price = item.priceFromVnd ?? item.priceVnd;
        const priceS = price != null ? ` · ${price} VND` : "";
        lines.push(`- [${label}] ${name}${slug}${priceS}`);
      }
    };
    if (data && typeof data === "object") {
      pushHits(data.hotels ?? data.hotel, "hotel");
      pushHits(data.tours ?? data.tour, "tour");
      pushHits(data.destinations ?? data.destination, "destination");
      if (Array.isArray(data.hits)) pushHits(data.hits, "hit");
      if (Array.isArray(data)) pushHits(data, "result");
    }
    if (lines.length === 0) {
      return { ok: true, context: "(no catalog hits)", hitCount: 0 };
    }
    const context = `CATALOG_CONTEXT (from search; prefer these facts):\n${lines.slice(0, limit * 3).join("\n")}`;
    return { ok: true, context, hitCount: lines.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "rag_error";
    return { ok: false, reason: msg.includes("abort") ? "rag_timeout" : msg };
  } finally {
    clearTimeout(timer);
  }
}
