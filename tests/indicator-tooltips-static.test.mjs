import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("dashboard indicators expose concise tooltip definitions", async () => {
  const [tooltips, publicLanding, operational, styles] = await Promise.all([
    readFile(new URL("../lib/indicator-tooltips.js", import.meta.url), "utf8"),
    readFile(new URL("../components/PublicLanding.js", import.meta.url), "utf8"),
    readFile(new URL("../components/OperationalWorkspace.js", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(tooltips, /totalCases: "All EVD case investigations/);
  assert.match(tooltips, /last 24h/);
  assert.match(tooltips, /screeningRecords: "Screening records/);
  assert.match(tooltips, /contactsListed: "Contacts registered/);
  assert.match(tooltips, /avgTat: "Average time from specimen collection/);
  assert.doesNotMatch(tooltips, /Pending results are not in the current schema/);
  assert.doesNotMatch(tooltips, /Gold/i);

  assert.match(`${publicLanding}\n${operational}`, /indicator-tooltip-host/);
  assert.match(publicLanding, /INDICATOR_TOOLTIPS/);
  assert.match(styles, /\.indicator-tooltip__bubble/);
  assert.match(styles, /\.indicator-tooltip-host:hover \.indicator-tooltip__bubble/);
});
