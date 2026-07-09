import { describe, it, expect } from "vitest";
import { hashToken, mintRefreshToken } from "./tokens.js";

describe("tokens", () => {
  it("hashes consistently", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });

  it("mints opaque refresh tokens", () => {
    const a = mintRefreshToken();
    const b = mintRefreshToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });
});
