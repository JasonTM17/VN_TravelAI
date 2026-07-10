/**
 * Sanitize values interpolated into Meilisearch filter expressions.
 * Only allow safe token characters; reject quotes and operators.
 */

const SAFE_TOKEN = /^[A-Za-z0-9_-]+$/;
const SAFE_SLUG = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

export function isSafeMeiliToken(value: string): boolean {
  return typeof value === "string" && value.length > 0 && value.length <= 64 && SAFE_TOKEN.test(value);
}

export function isSafeMeiliSlug(value: string): boolean {
  return typeof value === "string" && value.length > 0 && value.length <= 120 && SAFE_SLUG.test(value);
}

/** Returns filter fragment or null if value unsafe (caller skips filter). */
export function meiliEqString(attr: string, value: string | undefined): string | null {
  if (!value || !isSafeMeiliToken(attr)) return null;
  if (!isSafeMeiliSlug(value) && !isSafeMeiliToken(value)) return null;
  return `${attr} = "${value}"`;
}

export function meiliEqNumber(attr: string, raw: string | undefined): string | null {
  if (!raw || !isSafeMeiliToken(attr)) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  return `${attr} = ${n}`;
}

export function meiliCmpNumber(attr: string, op: ">=" | "<=", raw: string | undefined): string | null {
  if (!raw || !isSafeMeiliToken(attr)) return null;
  if (op !== ">=" && op !== "<=") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  return `${attr} ${op} ${n}`;
}
