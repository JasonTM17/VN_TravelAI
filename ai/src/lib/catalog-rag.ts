/** Meili-backed catalog retrieval for chat grounding (no vector DB). */

export async function retrieveCatalogContext(
  query: string,
  apiBaseUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const q = query.trim().slice(0, 120);
  if (!base || !q) return "";
  try {
    const res = await fetchImpl(`${base}/v1/search?q=${encodeURIComponent(q)}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return "";
    const json = (await res.json()) as {
      data?: {
        hotels?: Array<{ name?: string; slug?: string; priceFromVnd?: number }>;
        tours?: Array<{ titleEn?: string; titleVi?: string; slug?: string; priceFromVnd?: number }>;
        destinations?: Array<{ nameEn?: string; nameVi?: string; slug?: string }>;
      };
    };
    const lines: string[] = [];
    for (const h of json.data?.hotels?.slice(0, 4) ?? []) {
      lines.push(`- [hotel] ${h.name ?? h.slug}${h.priceFromVnd != null ? ` · ${h.priceFromVnd} VND` : ""}`);
    }
    for (const t of json.data?.tours?.slice(0, 3) ?? []) {
      lines.push(`- [tour] ${t.titleEn ?? t.titleVi ?? t.slug}`);
    }
    for (const d of json.data?.destinations?.slice(0, 3) ?? []) {
      lines.push(`- [destination] ${d.nameEn ?? d.nameVi ?? d.slug}`);
    }
    if (!lines.length) return "";
    return `CATALOG_CONTEXT:\n${lines.join("\n")}`;
  } catch {
    return "";
  }
}
