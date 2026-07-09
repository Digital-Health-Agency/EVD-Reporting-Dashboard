// API route: composed dashboard payload for Ebola.
//
// This is the seam the UI calls (never the warehouse directly). It delegates to
// the data layer, which selects an adapter. In v2 a Spring Boot service replaces
// the data layer behind this same URL contract.
//
//   GET /api/metrics/ebola   ->  full DashboardData for Ebola

import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/datasource";
import { diseaseByKey } from "@/lib/diseases";

export const dynamic = "force-dynamic"; // always read fresh from the warehouse

export async function GET(_req, { params }) {
  const { disease } = await params;

  if (!diseaseByKey(disease)) {
    return NextResponse.json(
      { error: `Unknown disease "${disease}"` },
      { status: 404 }
    );
  }

  try {
    const data = await getDashboardData(disease);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[api/metrics] failed:", err?.message || err);
    return NextResponse.json(
      { error: "Failed to load metrics" },
      { status: 500 }
    );
  }
}
