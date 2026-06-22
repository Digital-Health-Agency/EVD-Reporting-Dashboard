// Thin compatibility shim.
//
// The data layer now lives in lib/datasource/*. The UI reaches it through the
// API routes (app/api/metrics/[disease]) — components never query the warehouse
// directly. This module just re-exports the composed entry point for any
// server-side callers.

export { getDashboardData, getTestsByDisease } from "@/lib/datasource";
