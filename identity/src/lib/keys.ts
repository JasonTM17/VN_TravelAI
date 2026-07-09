import { generateKeyPair, exportJWK, importPKCS8, exportPKCS8, type KeyLike } from "jose";

export type KeySlot = {
  kid: string;
  privateKey: KeyLike;
  publicJwk: Record<string, unknown>;
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
 * Always returns dual key slots (PRIMARY + SECONDARY) for JWKS rotation readiness.
 * Missing PEMs generate ephemeral Ed25519 pairs (dev only).
 */
export async function loadKeySlots(primaryPem?: string, secondaryPem?: string): Promise<{
  primary: KeySlot;
  secondary: KeySlot;
}> {
  const primary = primaryPem?.trim()
    ? await keyFromPem(primaryPem, "primary")
    : await generateSlot("primary");

  const secondary = secondaryPem?.trim()
    ? await keyFromPem(secondaryPem, "secondary")
    : await generateSlot("secondary");

  return { primary, secondary };
}

export function toJwks(primary: KeySlot, secondary: KeySlot) {
  return {
    keys: [primary.publicJwk, secondary.publicJwk],
  };
}
