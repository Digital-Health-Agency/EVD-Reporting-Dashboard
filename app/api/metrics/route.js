// API route: cross-disease overview (total tests per disease).
//
//   GET /api/metrics  ->  [{ disease, total }, ...]

import { NextResponse } from "next/server";
import { getTestsByDisease } from "@/lib/datasource";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getTestsByDisease();
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/metrics] overview failed:", err?.message || err);
    return NextResponse.json({ error: "Failed to load overview" }, { status: 500 });
  }
}
