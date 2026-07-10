/** httpOnly refresh cookie helpers (no @fastify/cookie dependency). */

export const REFRESH_COOKIE_NAME = "travelai_refresh";

export type RefreshCookieOptions = {
  maxAgeSec: number;
  /** When true, sets Secure flag (required for SameSite=None). */
  secure: boolean;
  /** Lax (default same-site) or None (cross-site HTTPS). */
  sameSite?: "Lax" | "None" | "Strict";
  path?: string;
  /**
   * Optional Domain attribute (e.g. `.example.com`) for multi-subdomain refresh.
   * Empty/undefined = host-only cookie (local ports / single host).
   */
  domain?: string;
};

/** Build Set-Cookie value for opaque refresh token. */
export function buildRefreshSetCookie(token: string, opts: RefreshCookieOptions): string {
  const sameSite = opts.sameSite ?? "Lax";
  const path = opts.path ?? "/";
  const parts = [
    `${REFRESH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Path=${path}`,
    `Max-Age=${Math.max(0, Math.floor(opts.maxAgeSec))}`,
    "HttpOnly",
    `SameSite=${sameSite}`,
  ];
  const domain = opts.domain?.trim();
  if (domain) {
    // Reject values that look like injection / invalid cookie domain tokens
    if (/^(\.?[a-z0-9]([a-z0-9-]*[a-z0-9])?)(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(domain) || domain === "localhost") {
      parts.push(`Domain=${domain}`);
    }
  }
  if (opts.secure || sameSite === "None") {
    parts.push("Secure");
  }
  return parts.join("; ");
}

/** Clear cookie (Max-Age=0). */
export function buildRefreshClearCookie(opts?: {
  secure?: boolean;
  sameSite?: "Lax" | "None" | "Strict";
  path?: string;
  domain?: string;
}): string {
  return buildRefreshSetCookie("", {
    maxAgeSec: 0,
    secure: opts?.secure ?? false,
    sameSite: opts?.sameSite ?? "Lax",
    path: opts?.path ?? "/",
    domain: opts?.domain,
  });
}

/** Parse Cookie header and return refresh token raw value if present. */
export function parseRefreshCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    if (name !== REFRESH_COOKIE_NAME) continue;
    const raw = part.slice(idx + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

/** Prefer body refreshToken; fall back to cookie. */
export function resolveRefreshToken(
  bodyToken: string | undefined,
  cookieHeader: string | undefined,
): string | null {
  if (bodyToken && bodyToken.length >= 10) return bodyToken;
  const fromCookie = parseRefreshCookie(cookieHeader);
  if (fromCookie && fromCookie.length >= 10) return fromCookie;
  return null;
}
