import { describe, it, expect } from "vitest";
import { signBody, verifySignature } from "./hmac.js";

describe("hmac", () => {
  it("signs and verifies", () => {
    const body = JSON.stringify({ hello: "world" });
    const sig = signBody("secret", body);
    expect(verifySignature("secret", body, sig)).toBe(true);
    expect(verifySignature("wrong", body, sig)).toBe(false);
  });
});
