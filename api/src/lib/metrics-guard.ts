import { timingSafeEqual } from "node:crypto";

/**
 * When metricsToken is empty, metrics stay open (local DX).
 * Otherwise require Bearer or X-Metrics-Token match (timing-safe).
 */
export function metricsAuthorized(
  metricsToken: string | undefined,
  authorizationHeader: string | undefined,
  xMetricsToken: string | undefined,
): boolean {
  const expected = (metricsToken ?? "").trim();
  if (!expected) return true;

  let provided = (xMetricsToken ?? "").trim();
  if (!provided && authorizationHeader?.toLowerCase().startsWith("bearer ")) {
    provided = authorizationHeader.slice(7).trim();
  }
  if (!provided) return false;

  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
