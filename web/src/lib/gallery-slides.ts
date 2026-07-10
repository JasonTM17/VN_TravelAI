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

export type PromoSlide = {
  title: string;
  img: string;
  href: string;
  badge: string;
  badgeTone: "error" | "cta" | "info";
};

/** Home promo strip must ship ≥3 slides for carousel UX. */
export function assertPromoSlides(slides: PromoSlide[]): PromoSlide[] {
  if (slides.length < 3) {
    throw new Error(`promo slides require ≥3 items, got ${slides.length}`);
  }
  return slides;
}

export function buildHomePromoSlides(locale: "vi" | "en", base: string): PromoSlide[] {
  const vi = locale === "vi";
  const slides: PromoSlide[] = [
    {
      title: vi ? "Du thuyền Hạ Long đẳng cấp" : "Ha Long premium cruise",
      img: "/images/promo/01-ha-long.jpg",
      href: `${base}/destinations/ha-long`,
      badge: vi ? "Giảm đến 30%" : "Up to 30% off",
      badgeTone: "error",
    },
    {
      title: vi ? "Hội An — Mùa lồng đèn lung linh" : "Hoi An lantern nights",
      img: "/images/promo/02-hoi-an.jpg",
      href: `${base}/destinations/hoi-an`,
      badge: vi ? "Combo khách sạn + vé" : "Hotel + flight combo",
      badgeTone: "cta",
    },
    {
      title: vi ? "Đà Nẵng biển Mỹ Khê" : "Da Nang My Khe beach",
      img: "/images/promo/03-da-nang.jpg",
      href: `${base}/destinations/da-nang`,
      badge: vi ? "Deal cuối tuần" : "Weekend deal",
      badgeTone: "info",
    },
    {
      title: vi ? "Sapa săn mây Tây Bắc" : "Sapa cloud hunting",
      img: "/images/promo/04-sapa.jpg",
      href: `${base}/destinations/sapa`,
      badge: vi ? "Tour 2N1Đ" : "2D1N tour",
      badgeTone: "cta",
    },
  ];
  return assertPromoSlides(slides);
}
