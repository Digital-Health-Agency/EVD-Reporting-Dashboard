import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public landing includes key metrics and testing figures", async () => {
  const source = await readFile(new URL("../components/PublicLanding.js", import.meta.url), "utf8");

  assert.match(source, /Key metrics/);
  assert.match(source, /Last 24h/);
  assert.doesNotMatch(source, /Latest/);
  assert.match(source, /Confirmed cases/);
  assert.match(source, /label="Total Screened"/);
  assert.match(source, /label="Recoveries"/);
  assert.match(source, /label="Deaths"/);
  assert.doesNotMatch(source, /label="Tests done"/);
  assert.doesNotMatch(source, /label="Screening records"/);
  assert.match(source, /Detailed figures/);
  assert.match(source, /public-panel/);
  assert.match(source, /public-info/);
  assert.match(source, /Total tested/);
  assert.match(source, /Positive tests/);
  assert.doesNotMatch(source, /public-view-tabs/);
  assert.doesNotMatch(source, /role="tablist"/);
  assert.doesNotMatch(source, /Highlights/);
  assert.doesNotMatch(source, /label: "Cases"/);
  assert.doesNotMatch(source, /Contacts/);
  assert.doesNotMatch(source, /Alerts/);
  assert.doesNotMatch(source, /Points of entry/);
});
