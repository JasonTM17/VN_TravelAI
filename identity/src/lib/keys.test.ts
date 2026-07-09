import { describe, it, expect } from "vitest";
import { loadKeySlots, toJwks } from "./keys.js";

describe("loadKeySlots dual JWKS", () => {
  it("always returns primary and secondary keys without env PEMs", async () => {
    const { primary, secondary } = await loadKeySlots("", "");
    expect(primary.kid).toBe("primary");
    expect(secondary.kid).toBe("secondary");
    const jwks = toJwks(primary, secondary);
    expect(jwks.keys).toHaveLength(2);
    expect(jwks.keys.map((k) => k.kid)).toEqual(["primary", "secondary"]);
    for (const k of jwks.keys) {
      expect(k.kty === "OKP" || k.crv === "Ed25519" || k.alg === "EdDSA").toBeTruthy();
    }
  });
});
