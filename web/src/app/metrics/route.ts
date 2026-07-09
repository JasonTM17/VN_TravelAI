import { NextResponse } from "next/server";

/** Minimal Prometheus-style exposition for web process liveness metrics */
export async function GET() {
  const lines = [
    "# HELP travelai_web_up 1 if web process is serving",
    "# TYPE travelai_web_up gauge",
    "travelai_web_up 1",
    `# HELP travelai_web_info Web service metadata`,
    `# TYPE travelai_web_info gauge`,
    `travelai_web_info{service="web"} 1`,
  ];
  return new NextResponse(lines.join("\n") + "\n", {
    status: 200,
    headers: {
      "content-type": "text/plain; version=0.0.4; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
