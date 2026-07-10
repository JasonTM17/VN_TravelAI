import { generateKeyPair, exportJWK, importPKCS8, exportPKCS8, type KeyLike } from "jose";

export type KeySlot = {
  kid: string;
  privateKey: KeyLike;
  publicJwk: Record<string, unknown>;
};

export type LoadKeySlotsOptions = {
  /** When true, missing primary PEM throws (production / JWT_REQUIRE_PEM). */
  requirePem?: boolean;
  nodeEnv?: string;
};

async function keyFromPem(pem: string, kid: string): Promise<KeySlot> {
  const privateKey = await importPKCS8(pem.replace(/\\n/g, "\n"), "EdDSA");
  const jwk = await exportJWK(privateKey);
  const { d: _d, ...pub } = jwk;
  return {
    kid,
    privateKey,
    publicJwk: {
      ...pub,
      kid,
      alg: "EdDSA",
      use: "sig",
      crv: "Ed25519",
      kty: "OKP",
    },
  };
}

async function generateSlot(kid: string): Promise<KeySlot> {
  const { privateKey, publicKey } = await generateKeyPair("EdDSA", { crv: "Ed25519", extractable: true });
  const publicJwk = await exportJWK(publicKey);
  void exportPKCS8(privateKey);
  return {
    kid,
    privateKey,
    publicJwk: { ...publicJwk, kid, alg: "EdDSA", use: "sig", use_sig: true },
  };
}

/**
 * Returns dual key slots (PRIMARY + SECONDARY) for JWKS rotation.
 * Missing PEMs generate ephemeral pairs only in non-production when requirePem is false.
 */
export async function loadKeySlots(
  primaryPem?: string,
  secondaryPem?: string,
  options: LoadKeySlotsOptions = {},
): Promise<{
  primary: KeySlot;
  secondary: KeySlot;
}> {
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV ?? "development";
  const requirePem =
    options.requirePem === true ||
    nodeEnv === "production" ||
    process.env.JWT_REQUIRE_PEM === "true" ||
    process.env.JWT_REQUIRE_PEM === "1";

  const primaryTrim = primaryPem?.trim() ?? "";
  if (!primaryTrim) {
    if (requirePem) {
      throw new Error(
        "JWT_PRIMARY_PRIVATE_KEY is required in production (or when JWT_REQUIRE_PEM=true). Ephemeral keys are disabled.",
      );
    }
  }

  const primary = primaryTrim
    ? await keyFromPem(primaryTrim, "primary")
    : await generateSlot("primary");

  const secondaryTrim = secondaryPem?.trim() ?? "";
  const secondary = secondaryTrim
    ? await keyFromPem(secondaryTrim, "secondary")
    : await generateSlot("secondary");

  return { primary, secondary };
}

export function toJwks(primary: KeySlot, secondary: KeySlot) {
  return {
    keys: [primary.publicJwk, secondary.publicJwk],
  };
}
