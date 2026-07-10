/**
 * Pure helpers for multi-image galleries (testable without DOM).
 */

export function normalizeImageList(
  images: Array<string | null | undefined> | null | undefined,
  fallback: string,
): string[] {
  const cleaned = (images ?? [])
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => s.length > 0);
  // Dedupe while preserving order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const src of cleaned) {
    if (seen.has(src)) continue;
    seen.add(src);
    unique.push(src);
  }
  if (unique.length === 0) return [fallback];
  return unique;
}

export function clampSlideIndex(index: number, length: number): number {
  if (!Number.isFinite(index) || length <= 0) return 0;
  const n = Math.trunc(index);
  if (n < 0) return 0;
  if (n >= length) return length - 1;
  return n;
}

export function nextSlideIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return (clampSlideIndex(index, length) + 1) % length;
}

export function prevSlideIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return (clampSlideIndex(index, length) - 1 + length) % length;
}

export type { PromoSlideView as PromoSlide } from "./promo-map";

/** Home promo strip should show ≥3 slides when data is available. */
export function assertPromoSlides<T>(slides: T[]): T[] {
  if (slides.length < 3) {
    throw new Error(`promo slides require ≥3 items, got ${slides.length}`);
  }
  return slides;
}
