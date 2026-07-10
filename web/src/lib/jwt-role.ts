/**
 * Client-side JWT payload role read (UI only — server still enforces RBAC).
 */
export function readJwtRole(token: string | null | undefined): string | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json =
      typeof atob === "function"
        ? atob(b64 + pad)
        : Buffer.from(b64 + pad, "base64").toString("utf8");
    const payload = JSON.parse(json) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin";
}
