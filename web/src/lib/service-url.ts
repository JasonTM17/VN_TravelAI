/**
 * Resolve API base URL for browser vs Node SSR.
 * In Docker, SSR must use the compose network hostname (api:3001), not localhost.
 */
export function resolveServiceBaseUrl(opts: {
  internal?: string | null;
  publicUrl?: string | null;
  fallback: string;
  /** Injected for tests; defaults to typeof window === "undefined". */
  isServer?: boolean;
}): string {
  const server = opts.isServer ?? typeof window === "undefined";
  const internal = (opts.internal ?? "").trim();
  const pub = (opts.publicUrl ?? "").trim();
  if (server && internal) return internal.replace(/\/$/, "");
  if (pub) return pub.replace(/\/$/, "");
  return opts.fallback.replace(/\/$/, "");
}
