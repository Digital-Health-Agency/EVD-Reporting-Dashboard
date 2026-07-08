import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("operational workspace has Summary plus service-point tabs", async () => {
  const source = await readFile(new URL("../components/OperationalWorkspace.js", import.meta.url), "utf8");

  assert.match(source, /const OPERATIONAL_TABS = \[/);
  for (const tab of ["Summary", "Laboratory", "POE", "Health facilities", "Community", "Contacts", "EOC actions"]) {
    assert.match(source, new RegExp(`label: "${tab}"`));
  }
  assert.match(source, /useState\("summary"\)/);
  assert.match(source, /aria-label="Operational workspace tabs"/);
  assert.match(source, /ops-view-tabs/);
  assert.match(source, /tab--active/);
  assert.match(source, /function SummaryTab/);
  assert.match(source, /function ServiceDetailTab/);
});

test("each operational tab renders data filters for its own scope", async () => {
  const source = await readFile(new URL("../components/OperationalWorkspace.js", import.meta.url), "utf8");

  assert.match(source, /const TAB_FILTERS = \{/);
  for (const key of ["summary", "labs", "poe", "hf", "community", "contacts", "actions"]) {
    assert.match(source, new RegExp(`${key}: \\[`));
  }
  assert.match(source, /function OperationalTabFilters/);
  assert.match(source, /className="ops-tab-filter-panel"/);
  assert.match(source, /aria-label=\{`\$\{activeTab\.label\} data filters`\}/);
  assert.doesNotMatch(source, /<h3>Useful filters<\/h3>/);
});
