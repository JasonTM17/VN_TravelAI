import { generateKeyPair, exportJWK, importPKCS8, exportPKCS8, type KeyLike } from "jose";

export type KeySlot = {
  kid: string;
  privateKey: KeyLike;
  publicJwk: Record<string, unknown>;
};

async function keyFromPem(pem: string, kid: string): Promise<KeySlot> {
  const privateKey = await importPKCS8(pem.replace(/\\n/g, "\n"), "EdDSA");
  const { publicKey } = await import("jose").then(async (jose) => {
    // Derive public JWK via export of a temporary pair is not available from private alone easily;
    // use exportJWK on private then strip private fields.
    const jwk = await exportJWK(privateKey);
    const { d: _d, ...pub } = jwk;
    return { publicKey: pub };
  });
  return {
    kid,
    privateKey,
    publicJwk: {
      ...publicKey,
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
  // Keep PEM available for logs in dev only via export if needed
  void exportPKCS8(privateKey);
  return {
    kid,
    privateKey,
    publicJwk: { ...publicJwk, kid, alg: "EdDSA", use: "sig" },
  };
}

export async function loadKeySlots(primaryPem?: string, secondaryPem?: string): Promise<{
  primary: KeySlot;
  secondary: KeySlot | null;
}> {
  const primary = primaryPem?.trim()
    ? await keyFromPem(primaryPem, "primary")
    : await generateSlot("primary");

  let secondary: KeySlot | null = null;
  if (secondaryPem?.trim()) {
    secondary = await keyFromPem(secondaryPem, "secondary");
  }

  return { primary, secondary };
}

export function toJwks(primary: KeySlot, secondary: KeySlot | null) {
  const keys = [primary.publicJwk];
  if (secondary) keys.push(secondary.publicJwk);
  return { keys };
}
