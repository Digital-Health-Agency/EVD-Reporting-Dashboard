import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { DEFAULT_DISEASE, DISEASES, diseaseByKey, normalizeDisease } from "../lib/diseases.js";
import * as mock from "../lib/datasource/mock.js";

test("Ebola is the only configured disease", async () => {
  assert.equal(DEFAULT_DISEASE, "ebola");
  assert.deepEqual(DISEASES.map((disease) => disease.key), ["ebola"]);
  assert.equal(diseaseByKey("ebola")?.name, "Ebola");
  assert.equal(diseaseByKey("mpox"), undefined);
  assert.equal(diseaseByKey("marburg"), undefined);
  assert.equal(normalizeDisease("MPOX"), "Other");
  assert.equal(normalizeDisease("MARBURG"), "Other");

  const overview = await mock.testsByDisease();
  assert.deepEqual(overview.map((row) => row.disease), ["Ebola"]);
});

test("executive and operational UI do not expose non-Ebola disease choices", async () => {
  const [dashboardShell, operationalWorkspace, publicLanding, siteFooter] = await Promise.all([
    readFile(new URL("../components/DashboardShell.js", import.meta.url), "utf8"),
    readFile(new URL("../components/OperationalWorkspace.js", import.meta.url), "utf8"),
    readFile(new URL("../components/PublicLanding.js", import.meta.url), "utf8"),
    readFile(new URL("../components/SiteFooter.js", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(dashboardShell, /DISEASES\.map/);
  assert.doesNotMatch(`${dashboardShell}\n${operationalWorkspace}`, /Mpox|Marburg|Bundibugyo/i);
  assert.doesNotMatch(`${publicLanding}\n${siteFooter}`, /EVD\/BVD|Bundibugyo/i);
});
