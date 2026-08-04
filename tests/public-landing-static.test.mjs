import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public landing includes key metrics and testing figures", async () => {
  const source = await readFile(new URL("../components/PublicLanding.js", import.meta.url), "utf8");

  assert.match(source, /Key metrics/);
  assert.match(source, /Public Health Event/);
  assert.match(source, /public-health-event/);
  assert.match(source, /DEFAULT_DISEASE/);
  assert.match(source, /DISEASES\.map/);
  assert.match(source, /national public health surveillance and response systems/);
  assert.doesNotMatch(source, /national Ebola virus disease surveillance response/);
  assert.match(source, /KNPHI Live Situation Room/);
  assert.match(source, /\{selectedEvent\.name\} Updates/);
  assert.match(source, /As of \$\{updated\}/);
  assert.doesNotMatch(source, /Last updated/);
  assert.match(source, /Last 24h/);
  assert.doesNotMatch(source, /Latest/);
  assert.match(source, /label="Confirmed"/);
  assert.match(source, /label="Total Screened"/);
  assert.match(source, /label="Recoveries"/);
  assert.match(source, /label="Deaths"/);
  assert.match(source, /label="Total Tested"/);
  assert.match(source, /label="Positive"/);
  assert.doesNotMatch(source, /label="Tests done"/);
  assert.doesNotMatch(source, /label="Screening records"/);
  assert.match(source, /public-info/);
  assert.doesNotMatch(source, /public-view-tabs/);
  assert.doesNotMatch(source, /role="tablist"/);
  assert.doesNotMatch(source, /Highlights/);
  assert.doesNotMatch(source, /label: "Cases"/);
  assert.doesNotMatch(source, /Alerts/);
  assert.doesNotMatch(source, /Points of entry/);
});
