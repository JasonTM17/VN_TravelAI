/** Meili keyword search + optional vector semantic retrieval for chat grounding. */

export async function retrieveCatalogContext(
  query: string,
  apiBaseUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const q = query.trim().slice(0, 120);
  if (!base || !q) return "";

  const parts: string[] = [];

  try {
    const res = await fetchImpl(`${base}/v1/search?q=${encodeURIComponent(q)}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
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
      if (lines.length) parts.push(`CATALOG_CONTEXT:\n${lines.join("\n")}`);
    }
  } catch {
    // keyword search optional
  }

  try {
    const res = await fetchImpl(
      `${base}/v1/search/vectors?q=${encodeURIComponent(q)}&topK=4`,
      {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (res.ok) {
      const json = (await res.json()) as { data?: { context?: string } };
      const ctx = json.data?.context?.trim();
      if (ctx) parts.push(ctx);
    }
  } catch {
    // vector path optional (empty index / offline)
  }

  return parts.join("\n\n");
}
