import { describe, expect, it } from "vitest";
import { averageRating, isValidReviewTarget } from "./review-rating.js";

describe("review-rating", () => {
  it("averages to one decimal", () => {
    expect(averageRating([5, 4, 3])).toBe(4);
    expect(averageRating([5, 5, 4])).toBe(4.7);
    expect(averageRating([])).toBe(0);
  });

  it("requires exactly one of hotel or tour", () => {
    expect(isValidReviewTarget("h", null)).toBe(true);
    expect(isValidReviewTarget(null, "t")).toBe(true);
    expect(isValidReviewTarget("h", "t")).toBe(false);
    expect(isValidReviewTarget(null, null)).toBe(false);
  });
});
