/**
 * Read-only catalog tools for DeepSeek tool-calling.
 * Never expose admin/reindex/book. Max rounds enforced by caller.
 */

/** @type {unknown[]} */
export const CATALOG_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_catalog",
      description: "Search TravelAI catalog (destinations, hotels, tours) by free text.",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string", description: "Search query" },
        },
        required: ["q"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_hotel",
      description: "Get hotel details by slug.",
      parameters: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tour",
      description: "Get tour details by slug.",
      parameters: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_destination",
      description: "Get destination details by slug.",
      parameters: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
      },
    },
  },
];

const ALLOWED = new Set(["search_catalog", "get_hotel", "get_tour", "get_destination"]);

/**
 * @param {unknown} message - assistant message from DeepSeek/OpenAI
 * @returns {{ id: string, name: string, arguments: string }[]}
 */
export function extractToolCalls(message) {
  if (!message || typeof message !== "object") return [];
  const m = /** @type {Record<string, unknown>} */ (message);
  const raw = m.tool_calls;
  if (!Array.isArray(raw)) return [];
  /** @type {{ id: string, name: string, arguments: string }[]} */
  const out = [];
  for (const tc of raw) {
    if (!tc || typeof tc !== "object") continue;
    const t = /** @type {Record<string, unknown>} */ (tc);
    const fn = t.function && typeof t.function === "object" ? /** @type {Record<string, unknown>} */ (t.function) : {};
    const name = String(fn.name || "");
    if (!ALLOWED.has(name)) continue;
    out.push({
      id: String(t.id || `call_${out.length}`),
      name,
      arguments: typeof fn.arguments === "string" ? fn.arguments : JSON.stringify(fn.arguments ?? {}),
    });
  }
  return out;
}

/**
 * Validate and parse tool JSON args. Returns null if invalid.
 * @param {string} name
 * @param {string} argsJson
 * @returns {Record<string, string> | null}
 */
export function parseToolArgs(name, argsJson) {
  if (!ALLOWED.has(name)) return null;
  let obj;
  try {
    obj = JSON.parse(argsJson || "{}");
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (obj);
  if (name === "search_catalog") {
    const q = String(o.q ?? "").trim().slice(0, 120);
    if (!q) return null;
    return { q };
  }
  const slug = String(o.slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 80);
  if (!slug) return null;
  return { slug };
}

/**
 * Execute a single read-only catalog tool against public API.
 * @param {{
 *   name: string,
 *   args: Record<string, string>,
 *   apiBaseUrl: string,
 *   fetchImpl?: typeof fetch,
 *   timeoutMs?: number,
 * }} opts
 */
export async function executeCatalogTool(opts) {
  const base = String(opts.apiBaseUrl || "").replace(/\/$/, "");
  if (!base) return { ok: false, error: "missing_api_base" };
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") return { ok: false, error: "fetch_unavailable" };
  const timeoutMs = opts.timeoutMs ?? 8_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let path = "";
    if (opts.name === "search_catalog") {
      path = `/v1/search?q=${encodeURIComponent(opts.args.q)}`;
    } else if (opts.name === "get_hotel") {
      path = `/v1/hotels/${encodeURIComponent(opts.args.slug)}`;
    } else if (opts.name === "get_tour") {
      path = `/v1/tours/${encodeURIComponent(opts.args.slug)}`;
    } else if (opts.name === "get_destination") {
      path = `/v1/destinations/${encodeURIComponent(opts.args.slug)}`;
    } else {
      return { ok: false, error: "tool_not_allowed" };
    }
    // Block path traversal attempts beyond slug encoding
    if (path.includes("..") || path.includes("/v1/admin")) {
      return { ok: false, error: "tool_path_blocked" };
    }
    const res = await fetchImpl(`${base}${path}`, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.slice(0, 500) };
    }
    if (!res.ok) {
      return { ok: false, error: `http_${res.status}`, data };
    }
    // Cap payload size for LLM context
    const compact = JSON.stringify(data).slice(0, 4000);
    return { ok: true, result: compact };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "tool_error";
    return { ok: false, error: msg.includes("abort") ? "tool_timeout" : msg };
  } finally {
    clearTimeout(timer);
  }
}
