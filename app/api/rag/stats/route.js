import { resolveApiProxyUrl } from "@/lib/api-proxy-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Live dashboard metrics for the surveillance assistant. Returns the
// backend analytics payload verbatim (authoritative figures), plus an
// as_of timestamp the assistant quotes in its answers.
export async function GET() {
  try {
    const serverUrl = resolveApiProxyUrl();
    const response = await fetch(`${serverUrl}/api/analytics/metrics`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      return Response.json(
        { message: `Metrics request failed (HTTP ${response.status})` },
        { status: 502 }
      );
    }
    const metrics = await response.json();
    return Response.json({
      as_of: metrics?.meta?.lastUpdated || new Date().toISOString(),
      source: "EVD Reporting Dashboard /api/analytics/metrics",
      metrics,
    });
  } catch {
    return Response.json(
      { message: "Dashboard metrics are unavailable right now." },
      { status: 503 }
    );
  }
}
