import { describe, it, expect } from "vitest";
import { meiliCmpNumber, meiliEqNumber, meiliEqString, isSafeMeiliToken } from "./meili-filter.js";

describe("meili-filter sanitize", () => {
  it("allows safe country and slug tokens", () => {
    expect(meiliEqString("countryCode", "VN")).toBe('countryCode = "VN"');
    expect(meiliEqString("destinationSlug", "ha-noi")).toBe('destinationSlug = "ha-noi"');
  });

  it("rejects quote injection", () => {
    expect(meiliEqString("countryCode", 'VN" OR 1=1 OR countryCode="x')).toBeNull();
    expect(meiliEqString("destinationSlug", 'a" OR stars = 1')).toBeNull();
  });

  it("rejects empty and oversized", () => {
    expect(meiliEqString("countryCode", "")).toBeNull();
    expect(isSafeMeiliToken("a".repeat(65))).toBe(false);
  });

  it("only integer numbers for stars/price", () => {
    expect(meiliEqNumber("stars", "5")).toBe("stars = 5");
    expect(meiliEqNumber("stars", "5.5")).toBeNull();
    expect(meiliEqNumber("stars", "1;drop")).toBeNull();
    expect(meiliCmpNumber("priceFromVnd", ">=", "100000")).toBe("priceFromVnd >= 100000");
    expect(meiliCmpNumber("priceFromVnd", ">=", "abc")).toBeNull();
  });
});
