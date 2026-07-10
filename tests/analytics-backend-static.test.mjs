import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("dashboard fetches analytics through the backend API", async () => {
  const [dashboardShell, publicLanding, nextConfig] = await Promise.all([
    readFile(new URL("../components/DashboardShell.js", import.meta.url), "utf8"),
    readFile(new URL("../components/PublicLanding.js", import.meta.url), "utf8"),
    readFile(new URL("../next.config.mjs", import.meta.url), "utf8"),
  ]);

  assert.match(dashboardShell, /\/api\/analytics\/metrics/);
  assert.match(publicLanding, /\/api\/analytics\/metrics/);
  assert.match(nextConfig, /source: "\/api\/:path\*"/);
  assert.doesNotMatch(`${dashboardShell}\n${publicLanding}`, /\/api\/metrics\/ebola/);
});
