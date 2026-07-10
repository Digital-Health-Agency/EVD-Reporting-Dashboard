import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("dashboard indicators expose concise tooltip definitions", async () => {
  const [tooltips, dashboard, publicLanding, dashboardShell, operational, styles] = await Promise.all([
    readFile(new URL("../lib/indicator-tooltips.js", import.meta.url), "utf8"),
    readFile(new URL("../components/Dashboard.js", import.meta.url), "utf8"),
    readFile(new URL("../components/PublicLanding.js", import.meta.url), "utf8"),
    readFile(new URL("../components/DashboardShell.js", import.meta.url), "utf8"),
    readFile(new URL("../components/OperationalWorkspace.js", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(tooltips, /totalCases: "All EVD case records/);
  assert.match(tooltips, /screeningRecords: "Screening records/);
  assert.match(tooltips, /contactsListed: "Contact listing is awaiting/);
  assert.doesNotMatch(tooltips, /Gold/i);

  assert.match(`${dashboard}\n${publicLanding}\n${dashboardShell}\n${operational}`, /indicator-tooltip-host/);
  assert.match(`${dashboard}\n${publicLanding}\n${dashboardShell}`, /INDICATOR_TOOLTIPS/);
  assert.match(styles, /\.indicator-tooltip__bubble/);
  assert.match(styles, /\.indicator-tooltip-host:hover \.indicator-tooltip__bubble/);
});
