import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

test("source inspection: the list reads and clears through the credentialed client only", async () => {
  const component = await source("../components/reconciliation/ReconciliationList.js");

  assert.match(component, /api\.get\("\/reconciliation\/headline"\)/);
  assert.match(component, /api\.delete\(`\/reconciliation\/headline\/\$\{situationDate\}`, \{ expected_revision: row\.revision, expected_record_id: row\.record_id \}\)/);
  assert.strictEqual(
    count(component, /api\.\w+\(/g),
    2,
    "one read and one clear — creating and editing belong to the editor",
  );
  assert.doesNotMatch(component, /(?<![\w.])fetch\(/, "a bare fetch drops the session cookie and the app-id header");
  assert.doesNotMatch(component, /components\/operational/);
  assert.match(component, /formatSituationDate/);
  assert.match(component, /@\/lib\/headline-figures/, "the list and the editor share one date format");
  assert.doesNotMatch(component, /\.sort\(/, "the server orders the series; the first row served is the live one");
});

test("source inspection: the newest row is marked Live and a blank figure is not shown as zero", async () => {
  const component = await source("../components/reconciliation/ReconciliationList.js");

  assert.match(component, /account-pill--active/);
  assert.match(component, />Live</);
  assert.match(component, /title="Shown on the public dashboard"/);
  assert.match(component, /index === 0 \?/, "only the first row served carries the pill");
  assert.strictEqual(count(component, /account-pill--active/g), 1);

  assert.match(component, /aria-label="Not reported"/);
  assert.match(
    component,
    /Number\.isFinite\(row\[key\]\) \? fmt\(row\[key\]\) : <NotReported \/>/,
    "a null figure renders the dash, and a stored 0 renders 0",
  );
  for (const key of [
    "confirmed_cases",
    "confirmed_cases_24h",
    "deaths",
    "samples_tested_total",
    "travellers_screened_total",
    "contacts_listed",
  ]) {
    assert.ok(component.includes(`"${key}"`), `the list has no ${key} column`);
  }

  assert.match(component, /ops-linelist__cell-clamp/);
  assert.match(component, /title=\{row\.source_label\}/, "a clamped source keeps its full text");
  assert.doesNotMatch(component, /row\.notes/, "notes belong to the editor");
});

test("source inspection: clearing is a two-step inline confirmation, never a dialog", async () => {
  const component = await source("../components/reconciliation/ReconciliationList.js");

  assert.match(component, /Clear figures/);
  assert.match(component, /Keep figures/);
  assert.match(component, /The dashboard will fall back to warehouse figures for this date\./);
  assert.match(
    component,
    /const previous = index === 0 \? rows\[1\] : null;/,
    "only the live row has a row that takes its place, and an only row has none",
  );
  assert.match(
    component,
    /Clear \{formatted\}\?\{" "\}\s*\{previous\s*\? `This row is live\. The public dashboard will show the \$\{formatSituationDate\(previous\.situation_date\)\} figures instead\.`\s*: "The dashboard will fall back to warehouse figures for this date\."\}/,
    "clearing the live row puts the previous date on the public page, not the warehouse",
  );
  assert.match(component, /confirming === row\.situation_date/);
  assert.match(component, /onClick=\{\(\) => setConfirming\(null\)\}>Keep figures</, "keeping sends no request");
  assert.match(component, /btn btn--table btn--danger/);
  assert.match(component, /cleared\.`\)/);
  assert.doesNotMatch(component, /window\.confirm|(?<![\w.])confirm\(/);
  assert.doesNotMatch(component, /components\/ui\/dialog|role="dialog"/);

  const css = await source("../app/globals.css");
  assert.ok(
    css.indexOf(".btn--table.btn--danger {") > css.indexOf(".btn--table {"),
    "the table button's colours override the danger colours unless the compound rule follows it",
  );
});

test("source inspection: loading, empty and failed loads are three different states", async () => {
  const component = await source("../components/reconciliation/ReconciliationList.js");

  assert.match(component, /Loading official figures\.\.\./);
  assert.match(component, /No official figures entered/);
  assert.match(
    component,
    /Add a date to enter the port-health headline figures\. Until then the dashboard shows warehouse numbers\./,
  );
  assert.strictEqual(count(component, /colSpan=\{11\}/g), 2, "one loading row and one empty row, each spanning the table");
  const columns = /const FIGURE_COLUMNS = \[([\s\S]*?)\];/.exec(component);
  assert.ok(columns, "the figure columns must be declared once, as a list");
  assert.strictEqual(
    count(columns[1], /\["\w+", "[^"]+"\]/g) + count(component, /<th>[^<]+<\/th>|<th className="num">[^<]+<\/th>/g),
    11,
    "six figure columns plus dates, operational override, source and actions",
  );

  assert.match(component, /catch \(caught\)/);
  assert.match(component, /`Could not load official figures\. \$\{caught instanceof Error \? caught\.message :/);
  assert.match(component, /"Check your connection and try again\."/);
  assert.match(component, /onClick=\{fetchRows\}>Retry</);
  assert.match(
    component,
    /rows\.length === 0 \? \(\s*error \? null :/,
    "a failed load must not claim that no figures have been entered",
  );
  assert.match(component, /href="\/reconciliation\/new">Add date</);
  assert.match(component, /href=\{`\/reconciliation\/\$\{row\.situation_date\}`\}>View \/ edit</);
});

test("source inspection: the list offers no pagination, search, filter or bulk control", async () => {
  const component = await source("../components/reconciliation/ReconciliationList.js");

  assert.doesNotMatch(component, /users-pagination|setPage|totalPages/);
  assert.doesNotMatch(component, /users-toolbar|users-search|users-filter|type="search"/);
  assert.doesNotMatch(component, /<(input|select|textarea)\b/);
  assert.doesNotMatch(component, /Bulk|Import rows|Upload/);
});

test("source inspection: every layout class the list uses has a rule", async () => {
  const [component, css] = await Promise.all([
    source("../components/reconciliation/ReconciliationList.js"),
    source("../app/globals.css"),
  ]);

  for (const name of [
    "reconciliation-card",
    "reconciliation-list",
    "reconciliation-list__date",
    "reconciliation-list__source",
    "reconciliation-list__confirm",
  ]) {
    assert.ok(component.includes(name), `the list no longer uses ${name}`);
    assert.ok(css.includes(`.${name} `), `globals.css has no .${name} rule`);
  }
});

test("source inspection: the reconciliation route is a shell behind ReconciliationGate", async () => {
  const [page, gate] = await Promise.all([
    source("../app/reconciliation/page.js"),
    source("../components/auth/ReconciliationGate.js"),
  ]);

  assert.match(page, /components\/auth\/ReconciliationGate/);
  assert.match(page, /components\/reconciliation\/ReconciliationList/);
  assert.match(page, /<AppHeader variant="operational" \/>/);
  assert.match(
    page,
    /<ReconciliationGate>[\s\S]*<main className="console-page">[\s\S]*<ReconciliationList \/>[\s\S]*<\/ReconciliationGate>/,
    "the list renders only inside the gate",
  );
  assert.doesNotMatch(page, /AdminGate|isAdmin/, "admin alone does not open this surface");
  assert.doesNotMatch(page, /components\/operational/);
  assert.doesNotMatch(page, /(?<![\w.])fetch\(|api\./, "the route fetches nothing itself");
  assert.strictEqual(
    count(page, /function /g),
    1,
    "the route is a shell — a second component here is a gate or a table growing a second home",
  );

  assert.match(gate, /isReconciliation/);
  assert.match(gate, /if \(!isReconciliation\)/, "the gate reads the grant, not the admin flag");
  assert.doesNotMatch(gate, /isAdmin/);
});
