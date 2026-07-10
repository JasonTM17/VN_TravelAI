import { describe, it, expect } from "vitest";
import { loadKeySlots, toJwks } from "./keys.js";

describe("loadKeySlots dual JWKS", () => {
  it("returns primary and secondary without PEMs in development", async () => {
    const { primary, secondary } = await loadKeySlots("", "", { nodeEnv: "development", requirePem: false });
    expect(primary.kid).toBe("primary");
    expect(secondary.kid).toBe("secondary");
    const jwks = toJwks(primary, secondary);
    expect(jwks.keys).toHaveLength(2);
    expect(jwks.keys.map((k) => k.kid)).toEqual(["primary", "secondary"]);
    for (const k of jwks.keys) {
      expect(k.kty === "OKP" || k.crv === "Ed25519" || k.alg === "EdDSA").toBeTruthy();
    }
  });

  it("throws when requirePem and primary PEM empty", async () => {
    await expect(loadKeySlots("", "", { requirePem: true })).rejects.toThrow(/JWT_PRIMARY_PRIVATE_KEY/);
  });

  it("throws in production nodeEnv when primary PEM empty", async () => {
    await expect(loadKeySlots(undefined, undefined, { nodeEnv: "production" })).rejects.toThrow(
      /JWT_PRIMARY_PRIVATE_KEY/,
    );
  });
});
