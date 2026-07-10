import { describe, it, expect } from "vitest";
import {
  normalizeImageList,
  clampSlideIndex,
  nextSlideIndex,
  prevSlideIndex,
  assertPromoSlides,
} from "./gallery-slides";

describe("normalizeImageList", () => {
  it("dedupes and drops empties, falls back when empty", () => {
    expect(normalizeImageList(["/a.jpg", "", "/a.jpg", "/b.jpg"], "/fb.jpg")).toEqual([
      "/a.jpg",
      "/b.jpg",
    ]);
    expect(normalizeImageList([], "/fb.jpg")).toEqual(["/fb.jpg"]);
    expect(normalizeImageList(null, "/fb.jpg")).toEqual(["/fb.jpg"]);
  });
});

describe("slide index bounds", () => {
  it("clamps and wraps next/prev", () => {
    expect(clampSlideIndex(-1, 3)).toBe(0);
    expect(clampSlideIndex(99, 3)).toBe(2);
    expect(nextSlideIndex(2, 3)).toBe(0);
    expect(prevSlideIndex(0, 3)).toBe(2);
    expect(nextSlideIndex(0, 1)).toBe(0);
  });
});

describe("assertPromoSlides", () => {
  it("requires ≥3 items", () => {
    expect(assertPromoSlides([1, 2, 3])).toEqual([1, 2, 3]);
    expect(() => assertPromoSlides([1, 2])).toThrow(/≥3/);
  });
});
