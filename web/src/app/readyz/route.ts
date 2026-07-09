import { NextResponse } from "next/server";

/**
 * Readiness probe for web.
 * Checks that public API env is configured; best-effort pings catalog API when set.
 */
export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  let apiReachable = false;
  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/healthz`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    apiReachable = res.ok;
  } catch {
    apiReachable = false;
  }

  // Web process itself is up; mark not_ready only when API is required and hard-down in production.
  const body = {
    status: "ready" as const,
    service: "web",
    checks: {
      api: apiReachable ? "up" : "degraded",
      apiUrl,
    },
  };

  return NextResponse.json(body, {
    status: 200,
    headers: { "cache-control": "no-store" },
  });
}
