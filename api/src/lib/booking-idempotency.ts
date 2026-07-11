import { createHash } from "node:crypto";

export function fingerprintBookingRequest(data: Record<string, unknown>): string {
  const canonical = Object.fromEntries(
    Object.entries(data).sort(([left], [right]) => left.localeCompare(right)),
  );
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

/** Legacy rows predate request fingerprints and remain safely scoped by user. */
export function idempotencyRequestMatches(
  storedFingerprint: string | null,
  requestFingerprint: string,
): boolean {
  return storedFingerprint === null || storedFingerprint === requestFingerprint;
}
