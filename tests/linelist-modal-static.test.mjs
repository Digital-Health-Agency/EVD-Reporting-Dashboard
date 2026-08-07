import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const modalUrl = new URL("../components/operational/LinelistModal.js", import.meta.url);
const tableUrl = new URL("../components/operational/LinelistTable.js", import.meta.url);
const pagerUrl = new URL("../components/operational/LinelistPager.js", import.meta.url);
const chooserUrl = new URL("../components/operational/ColumnChooser.js", import.meta.url);
const cssUrl = new URL("../app/globals.css", import.meta.url);

test("linelist modal keeps search input and empty-state contracts in source", async () => {
  const source = await readFile(modalUrl, "utf8");

  assert.match(source, /const SEARCH_DEBOUNCE_MS = 250/);
  assert.match(source, /maxLength=\{200\}/);
  assert.match(source, /placeholder="Search these records"/);
  assert.match(source, /No records in this selection/);
  assert.match(source, /No records match your search/);
  assert.match(source, /aria-label="Clear search"/);
  assert.match(source, />Clear search<\/button>/);
  assert.doesNotMatch(source, /Showing top/);
  assert.doesNotMatch(source, /\b(?:about|roughly|approx(?:imate(?:ly)?)?)\b/i);
});

test("linelist modal chrome keeps live scope and groups header actions", async () => {
  const source = await readFile(modalUrl, "utf8");

  assert.match(
    source,
    /<div className="ops-linelist__head-actions">[\s\S]*?Export could not be started\.[\s\S]*?onClick=\{handleExport\}[\s\S]*?Export CSV[\s\S]*?<Dialog\.Close className="ops-linelist__head-close" aria-label="Close">/,
  );
  assert.match(source, /<footer className="ops-linelist__foot">[\s\S]*?<LinelistPager[\s\S]*?<Dialog\.Close>Close<\/Dialog\.Close>/);
  assert.doesNotMatch(source, /ops-linelist__foot-actions/);

  assert.match(source, /export function scopeChips\(entry, tabParams\)/);
  assert.match(source, /Object\.entries\(tabParams \|\| \{\}\)/);
  assert.match(source, /Object\.entries\(entry\?\.predicate \|\| \{\}\)/);
  assert.match(source, /const scope = scopeChips\(entry, tabParams\)/);
  assert.match(source, /ops-linelist__scope-chip/);

  assert.equal((source.match(/aria-live=/g) || []).length, 1);
});

test("linelist modal keeps the inline search clear and places the exact count in the toolbar", async () => {
  const source = await readFile(modalUrl, "utf8");

  assert.match(
    source,
    /<div className="ops-linelist__search">[\s\S]*?<SearchGlyph \/>[\s\S]*?<input[\s\S]*?ops-linelist__search-clear[\s\S]*?<\/div>/,
  );
  assert.doesNotMatch(source, /<button className="btn btn--secondary" type="button" onClick=\{\(\) => \{\s*\n\s*setQ\(""\);/);

  assert.match(
    source,
    /<div className="ops-linelist__controls">[\s\S]*?ops-linelist__search[\s\S]*?<ColumnChooser[\s\S]*?<Dialog\.Description aria-live="polite">\{countText\(payload\)\}<\/Dialog\.Description>/,
  );
  assert.doesNotMatch(source, /<Dialog\.Title>\{entry\.listLabel\}<\/Dialog\.Title>\s*<Dialog\.Description/);
});

test("linelist stylesheet segments a wide dense shell and becomes a sheet on small screens", async () => {
  const source = await readFile(cssUrl, "utf8");

  assert.match(source, /\.ops-linelist-popup \{[\s\S]*?width: min\(calc\(100vw - 48px\), 1240px\);[\s\S]*?max-height: calc\(100dvh - 48px\);[\s\S]*?padding: 0;/);
  assert.match(source, /\.ops-linelist__head \{[\s\S]*?padding: 24px 28px;/);
  assert.match(source, /\.ops-linelist__controls \{[\s\S]*?padding: 14px 28px;/);
  assert.match(source, /\.ops-linelist__foot \{[\s\S]*?padding: 14px 28px;/);
  assert.match(source, /\.ops-linelist__head-actions/);
  assert.match(source, /\.ops-linelist__head-close/);
  assert.match(source, /\.ops-linelist__scope-chip/);
  assert.match(source, /\.ops-linelist__search-clear/);

  assert.match(
    source,
    /@media \(max-width: 639px\) \{[\s\S]*?\.ops-linelist-popup \{[\s\S]*?inset: 0;[\s\S]*?height: 100dvh;[\s\S]*?border-radius: 0;[\s\S]*?transform: none;/,
  );

  assert.match(
    source,
    /@media \(prefers-reduced-motion: reduce\) \{\s*\n\s*\.ops-linelist-backdrop,\s*\n\s*\.ops-linelist-popup/,
  );
});

test("linelist responsive chrome wraps deliberately and keeps the sheet body as the record scroller", async () => {
  const source = await readFile(cssUrl, "utf8");

  assert.match(
    source,
    /@media \(max-width: 900px\) \{[\s\S]*?\.ops-linelist__head-main \{[\s\S]*?flex-basis: 100%;[\s\S]*?\.ops-linelist__head-actions \{[\s\S]*?width: 100%;[\s\S]*?\.ops-linelist__count \{[\s\S]*?flex-basis: 100%;[\s\S]*?order: 3;/,
  );

  assert.match(source, /\.ops-linelist-popup \{[\s\S]*?overflow: hidden;/);
  assert.match(source, /\.ops-linelist__body \{[\s\S]*?overflow: auto;[\s\S]*?overscroll-behavior: contain;/);
  assert.match(source, /\.ops-linelist \.table-wrap \{[\s\S]*?overflow: visible;/);

  assert.match(
    source,
    /@media \(max-width: 639px\) \{[\s\S]*?\.ops-linelist__search,[\s\S]*?\.ops-linelist__columns-trigger \{[\s\S]*?width: 100%;[\s\S]*?\.ops-linelist__columns-panel \{[\s\S]*?max-height: min\(320px, calc\(100dvh - 240px\)\);[\s\S]*?\.ops-linelist__pager \{[\s\S]*?flex-basis: 100%;/,
  );
  assert.match(source, /\.ops-linelist__page \{[\s\S]*?min-width: 44px;[\s\S]*?min-height: 44px;/);
});

test("linelist focus, motion and presentation rules stay inside the modal boundary", async () => {
  const source = await readFile(cssUrl, "utf8");
  const block = source.slice(
    source.indexOf("/* ---------- Operational linelist ---------- */"),
    source.indexOf("/* ---------- Shared official footer ---------- */"),
  );

  assert.match(block, /\.ops-linelist button:focus-visible/);
  assert.match(block, /outline: 3px solid var\(--focus-ring\)/);
  assert.match(block, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(block, /\.ops-summary|\.ops-panel|\.service-tab/);
});

test("linelist table exposes only registry-authorised sort controls", async () => {
  const source = await readFile(tableUrl, "utf8");

  assert.match(source, /column\.sortable\s*\?/);
  assert.match(source, /aria-sort/);
  assert.match(source, /aria-label=\{`Sort by \$\{column\.label\}`\}/);
  assert.match(source, /ops-linelist__sort/);
  assert.match(source, /active \? <span aria-hidden="true">\{direction === "asc" \? "▲" : "▼"\}<\/span> : null/);
});

test("linelist table renders each cell by its server-declared format", async () => {
  const source = await readFile(tableUrl, "utf8");

  assert.match(source, /column\.format/);

  assert.match(source, /format === "status"/);
  assert.match(source, /format === "boolean"/);
  assert.match(source, /format === "date"/);
  assert.match(source, /format === "datetime"/);
  assert.match(source, /format === "identifier"/);
  assert.match(source, /format === "number"/);
  assert.match(source, /String\(value\)/);

  assert.match(source, /ops-linelist__chip ops-linelist__chip--\$\{severity\}/);
  assert.match(source, /const NEUTRAL_SEVERITY = "neutral"/);
  assert.match(source, /hasOwnProperty\.call\(STATUS_SEVERITY, key\)/);

  assert.match(source, /ops-linelist__mono/);
  assert.match(source, /ops-linelist__quiet/);

  assert.match(source, /ops-linelist__null/);
  assert.match(source, /title=\{text\}/);
});

test("linelist table derives one row severity and feeds both the rail and the chip", async () => {
  const source = await readFile(tableUrl, "utf8");

  assert.match(source, /columns\.find\(\(column\) => column\.format === "status"\)/);
  assert.match(source, /data-severity=/);
  assert.match(source, /severityOf\(row\[severityColumn\.name\]\)/);
  assert.match(source, /const severity = severityOf\(value\)/);
  assert.equal((source.match(/function severityOf/g) || []).length, 1);
});

test("linelist table never reads a calendar day off a local-time Date", async () => {
  const source = await readFile(tableUrl, "utf8");

  assert.match(source, /\^\(\\d\{4\}\)-\(\\d\{2\}\)-\(\\d\{2\}\)/);
  assert.doesNotMatch(source, /\.get(?:FullYear|Month|Date|Day|Hours|Minutes)\(/);
  assert.doesNotMatch(source, /toLocaleDateString|toLocaleTimeString|toDateString/);
  assert.match(source, /timeZone: DISPLAY_TIME_ZONE/);
  assert.match(source, /const DISPLAY_TIME_ZONE = "Africa\/Nairobi"/);
});

test("linelist stylesheet carries the chips, the severity rail and the sticky first column", async () => {
  const source = await readFile(cssUrl, "utf8");

  for (const severity of ["alert", "success", "warning", "info", "neutral"]) {
    assert.match(source, new RegExp(`\\.ops-linelist__chip--${severity}`));
    assert.match(source, new RegExp(`tr\\[data-severity="${severity}"\\]`));
  }

  assert.match(source, /color-mix\(in srgb, var\(--color-alert\) 10%, #ffffff\)/);
  assert.match(source, /color-mix\(in srgb, var\(--color-alert\) 30%, #ffffff\)/);

  assert.match(source, /box-shadow: inset 3px 0 0 var\(--ops-rail\)/);
  assert.match(source, /\.ops-linelist \.data-table th:first-child,\s*\n\.ops-linelist \.data-table td:first-child \{\s*\n\s*position: sticky/);

  assert.match(source, /\.ops-linelist \.data-table tbody tr:nth-child\(even\) td \{/);
  assert.match(source, /\.ops-linelist \.data-table tbody tr:nth-child\(even\) td:first-child \{/);
  assert.match(source, /\.ops-linelist \.data-table tbody tr:hover td,/);
  assert.match(source, /\.ops-linelist \.data-table tbody tr:hover td:first-child \{/);
});

test("linelist pager is bounded, accessible, and absent for one page", async () => {
  const source = await readFile(pagerUrl, "utf8");

  assert.equal((source.match(/<button/g) || []).length, 2);
  assert.equal((source.match(/ops-linelist__page-indicator/g) || []).length, 1);
  assert.doesNotMatch(source, /\.map\(/);
  assert.doesNotMatch(source, /ellipsis/i);

  assert.match(source, /totalPages <= 1/);
  assert.match(source, /return null/);
  assert.match(source, /aria-current="page"/);
  assert.match(source, /ops-linelist__page-indicator" aria-current="page"/);
  assert.match(source, /type="button"/);
  assert.match(source, /aria-busy/);
  assert.doesNotMatch(source, /Array\.from\(\{\s*length:\s*totalPages/);
});

test("linelist pager offers direct page entry that refuses an out-of-range jump", async () => {
  const source = await readFile(pagerUrl, "utf8");

  assert.match(source, /‹ Prev/);
  assert.match(source, /Next ›/);
  assert.match(source, /of \{totalPages\}/);
  assert.match(source, /type="number"/);
  assert.match(source, /aria-label="Go to page"/);
  assert.match(source, /min=\{1\}/);
  assert.match(source, /max=\{totalPages\}/);

  assert.match(source, /Number\.parseInt\(String\(rawValue\), 10\)/);
  assert.match(source, /if \(!Number\.isInteger\(next\)\) return/);
  assert.match(source, /if \(next < 1 \|\| next > totalPages\) return/);

  assert.match(source, /disabled=\{busy \|\| page <= 1\}/);
  assert.match(source, /disabled=\{busy \|\| page >= totalPages\}/);
});

test("linelist modal keeps exact counts and resets paging for search and sort", async () => {
  const source = await readFile(modalUrl, "utf8");

  assert.match(source, /`Showing \$\{fmt\(from\)\}–\$\{fmt\(to\)\} of \$\{fmt\(total\)\}`/);
  assert.match(source, /function handleSort/);
  assert.match(source, /setPage\(1\)/);
});

test("column chooser is an accessible disclosure with a non-empty selection guard", async () => {
  const source = await readFile(chooserUrl, "utf8");

  assert.match(source, /<button[^>]*type="button"/s);
  assert.match(source, /aria-expanded/);
  assert.match(source, /Columns · \$\{selected\.length\} of \$\{allColumns\.length\}/);
  assert.match(source, /type="checkbox"/);
  assert.match(source, /<label/);
  assert.match(source, /disabled=\{checked && selected\.length === 1\}/);
  assert.match(source, /disabled=/);
  assert.match(source, /ops-linelist__columns-panel/);
  assert.doesNotMatch(source, /(?:import|<)\s*Dialog/);
});

test("column chooser offers panel actions that can never empty the selection", async () => {
  const source = await readFile(chooserUrl, "utf8");

  assert.match(source, />\s*Reset to default\s*</);
  assert.match(source, />\s*Select all\s*</);
  assert.match(source, />\s*Clear all\s*</);

  assert.match(source, /function clearAll\(\)/);
  assert.match(source, /const first = allColumns\[0\]/);
  assert.match(source, /emit\(\[first\.name\]\)/);
  assert.doesNotMatch(source, /onChange\(\[\]\)|emit\(\[\]\)/);

  assert.match(source, /function resetToDefault\(\)/);
  assert.match(source, /defaultSet/);

  assert.match(source, />Shown by default</);
  assert.match(source, />Additional columns</);
  assert.match(source, /defaultSet\.has\(column\.name\)/);
});

test("linelist modal drives selection from server availableColumns and reconciles active columns", async () => {
  const source = await readFile(modalUrl, "utf8");

  assert.match(source, /payload\.availableColumns/);
  assert.match(source, /<ColumnChooser/);
  assert.match(source, /allColumns=\{availableColumns\}/);
  assert.match(source, /setChosen/);
  assert.match(source, /next\.columns/);
  assert.match(source, /fields:\s*chosen/);
  assert.doesNotMatch(source, /const\s+(?:ALL|AVAILABLE|ALLOWED)_COLUMNS/);
});

test("linelist modal initiates native export with an honest preparation-only state", async () => {
  const source = await readFile(modalUrl, "utf8");

  assert.match(source, /import \{ exportLinelist \} from "@\/lib\/linelist-export"/);
  assert.doesNotMatch(source, /import[^\n]*exportLinelist[^\n]*api-client/);
  assert.match(source, /className="btn btn--primary ops-linelist__export"/);
  assert.match(source, /<DownloadGlyph \/>[\s\S]*?\{preparingExport \? "Preparing download…" : "Export CSV"\}/);
  assert.match(source, /disabled=\{preparingExport\}/);
  assert.match(source, /aria-busy=\{preparingExport\}/);
  assert.match(source, /Export could not be started\./);
  assert.match(source, />Try again</);

  assert.match(
    source,
    /page:\s*_page,\s*limit:\s*_limit,\s*pageSize:\s*_pageSize,\s*\.\.\.exportParams/s,
  );
  assert.match(source, /exportLinelist\(path,\s*exportParams\)/);

  assert.equal((source.match(/aria-live="polite"/g) || []).length, 1);
  assert.doesNotMatch(source, /components\/ui\/progress/);
  assert.doesNotMatch(source, /onProgress|rowsExported|EXPORT_PROGRESS_THROTTLE/);
  assert.doesNotMatch(source, /download (?:complete|completed|failed)/i);
});
