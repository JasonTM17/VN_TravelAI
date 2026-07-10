import { randomBytes, createHash } from "node:crypto";
import { SignJWT } from "jose";
import type { KeySlot } from "./keys.js";
import type { AppConfig } from "../config.js";

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function mintRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function mintAccessToken(
  user: { id: string; email: string; fullName: string; role?: string },
  primary: KeySlot,
  config: AppConfig,
): Promise<{ accessToken: string; expiresIn: number }> {
  const expiresIn = config.ACCESS_TOKEN_TTL_SEC;
  const accessToken = await new SignJWT({
    email: user.email,
    name: user.fullName,
    role: user.role ?? "user",
  })
    .setProtectedHeader({ alg: "EdDSA", kid: primary.kid, typ: "JWT" })
    .setSubject(user.id)
    .setIssuer(config.JWT_ISSUER)
    .setAudience(config.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(primary.privateKey);

  return { accessToken, expiresIn };
}
