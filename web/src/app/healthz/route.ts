import { NextResponse } from "next/server";

/** Liveness probe — required for every TravelAI app service */
export async function GET() {
  return NextResponse.json(
    { status: "ok", service: "web" },
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
