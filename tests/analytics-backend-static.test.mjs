import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("dashboard fetches analytics through the backend API", async () => {
  const [publicLanding, operational, nextConfig] = await Promise.all([
    readFile(new URL("../components/PublicLanding.js", import.meta.url), "utf8"),
    readFile(new URL("../components/OperationalWorkspace.js", import.meta.url), "utf8"),
    readFile(new URL("../next.config.mjs", import.meta.url), "utf8"),
  ]);

  assert.match(publicLanding, /\/api\/analytics\/metrics/);
  assert.match(nextConfig, /source: "\/api\/:path\*"/);

  assert.match(operational, /from "@\/lib\/api-client"/);
  assert.doesNotMatch(operational, /https?:\/\//);

  assert.doesNotMatch(`${publicLanding}\n${operational}`, /\/api\/metrics\/ebola/);
});
