import { describe, it, expect } from "vitest";
import { mapPromoToSlide, mapPromosToSlides, normalizeBadgeTone } from "./promo-map";

const sample = {
  slug: "ha-long-cruise",
  titleVi: "Du thuyền Hạ Long",
  titleEn: "Ha Long cruise",
  badgeVi: "Giảm 30%",
  badgeEn: "30% off",
  badgeTone: "error",
  imageUrl: "/images/promo/01-ha-long.jpg",
  hrefPath: "/destinations/ha-long",
};

describe("mapPromoToSlide (shipped mapper)", () => {
  it("maps DTO fields by locale without hard-coded destination titles", () => {
    const vi = mapPromoToSlide(sample, "vi", "/vi");
    expect(vi.title).toBe("Du thuyền Hạ Long");
    expect(vi.badge).toBe("Giảm 30%");
    expect(vi.href).toBe("/vi/destinations/ha-long");
    expect(vi.img).toBe("/images/promo/01-ha-long.jpg");
    expect(vi.badgeTone).toBe("error");

    const en = mapPromoToSlide(sample, "en", "/en");
    expect(en.title).toBe("Ha Long cruise");
    expect(en.href).toBe("/en/destinations/ha-long");
  });

  it("maps list and normalizes tone", () => {
    expect(normalizeBadgeTone("weird")).toBe("cta");
    const slides = mapPromosToSlides([sample, { ...sample, slug: "x", hrefPath: "tours/a" }], "vi", "/vi");
    expect(slides).toHaveLength(2);
    expect(slides[1].href).toBe("/vi/tours/a");
  });
});
