/**
 * Map API promo DTO → carousel slide props (presentation only).
 */
export type PromoDto = {
  slug: string;
  titleVi: string;
  titleEn: string;
  badgeVi: string;
  badgeEn: string;
  badgeTone: string;
  imageUrl: string;
  hrefPath: string;
  sortOrder?: number;
  active?: boolean;
};

export type PromoSlideView = {
  title: string;
  img: string;
  href: string;
  badge: string;
  badgeTone: "error" | "cta" | "info";
};

export function normalizeBadgeTone(tone: string | null | undefined): "error" | "cta" | "info" {
  if (tone === "error" || tone === "info" || tone === "cta") return tone;
  return "cta";
}

/** locale base e.g. "/vi" + hrefPath "/destinations/ha-long" → "/vi/destinations/ha-long" */
export function mapPromoToSlide(promo: PromoDto, locale: "vi" | "en", localeBase: string): PromoSlideView {
  const path = promo.hrefPath.startsWith("/") ? promo.hrefPath : `/${promo.hrefPath}`;
  return {
    title: locale === "en" ? promo.titleEn : promo.titleVi,
    img: promo.imageUrl || "/images/categories/hotels.jpg",
    href: `${localeBase.replace(/\/$/, "")}${path}`,
    badge: locale === "en" ? promo.badgeEn : promo.badgeVi,
    badgeTone: normalizeBadgeTone(promo.badgeTone),
  };
}

export function mapPromosToSlides(
  promos: PromoDto[] | null | undefined,
  locale: "vi" | "en",
  localeBase: string,
): PromoSlideView[] {
  return (promos ?? [])
    .filter((p) => p && p.imageUrl && p.hrefPath)
    .map((p) => mapPromoToSlide(p, locale, localeBase));
}
