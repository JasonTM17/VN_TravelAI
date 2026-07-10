import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";

const staticPaths = ["", "/hotels", "/tours", "/flights", "/transport", "/explore", "/search", "/ai"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:53000";
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const p of staticPaths) {
      entries.push({
        url: `${base}/${locale}${p}`,
        changeFrequency: p === "" ? "daily" : "weekly",
        priority: p === "" ? 1 : 0.7,
      });
    }
  }
  return entries;
}
