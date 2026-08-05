import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("dashboard fetches analytics through the backend API", async () => {
  const [publicLanding, nextConfig] = await Promise.all([
    readFile(new URL("../components/PublicLanding.js", import.meta.url), "utf8"),
    readFile(new URL("../next.config.mjs", import.meta.url), "utf8"),
  ]);

  assert.match(publicLanding, /\/api\/analytics\/metrics/);
  assert.match(nextConfig, /source: "\/api\/:path\*"/);
  assert.doesNotMatch(publicLanding, /\/api\/metrics\/ebola/);
});
