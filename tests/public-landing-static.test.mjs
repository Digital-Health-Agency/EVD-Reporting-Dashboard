import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const appRoot = fileURLToPath(new URL("../app/", import.meta.url));

async function routeFiles(directory = appRoot) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return routeFiles(path);
    return /^(?:page|route)\.[cm]?[jt]sx?$/.test(entry.name) ? [path] : [];
  }));
  return nested.flat();
}

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

  assert.match(source, /label="Contacts follow-up"/);
  assert.doesNotMatch(source, /contact_registration_key|source_contact_name|source_contact_identifier/);
  assert.doesNotMatch(source, /\/linelist/);
  assert.doesNotMatch(source, /components\/operational/);
  assert.doesNotMatch(source, /LinelistModal|LinelistTable|LinelistPager|ColumnChooser|linelist-export/);
  assert.doesNotMatch(source, /operational\/linelist/);
});

test("only the authenticated operational app route may import operational components", async () => {
  for (const file of await routeFiles()) {
    const route = relative(appRoot, file);
    if (route.startsWith("operational/")) continue;

    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /components\/operational/, route);
  }
});
