import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function source() {
  return readFile(new URL("../components/OperationalWorkspace.js", import.meta.url), "utf8");
}

function linelistTableSource() {
  return readFile(
    new URL("../components/operational/LinelistTable.js", import.meta.url),
    "utf8",
  );
}

function summaryTabBody(src) {
  const start = src.indexOf("function SummaryTab(");
  assert.notEqual(start, -1, "SummaryTab is declared");
  const next = src.indexOf("\nfunction ", start + 1);
  return src.slice(start, next === -1 ? undefined : next);
}

test("operational workspace has Summary plus service-point tabs", async () => {
  const src = await source();

  assert.match(src, /const OPERATIONAL_TABS = \[/);
  for (const tab of ["Summary", "Laboratory", "POE", "Health facilities", "Community", "Contacts"]) {
    assert.match(src, new RegExp(`label: "${tab}"`));
  }
  assert.match(src, /useState\("summary"\)/);
  assert.match(src, /aria-label="Operational workspace tabs"/);
  assert.match(src, /ops-view-tabs/);
  assert.match(src, /tab--active/);
  assert.match(src, /function SummaryTab/);
  assert.match(src, /function ServiceDetailTab/);
});

test("the EOC actions tab is gone, along with its panel and status tag", async () => {
  const src = await source();

  assert.doesNotMatch(src, /label: "EOC actions"/);
  assert.doesNotMatch(src, /^ {2}actions: \[/m);
  assert.doesNotMatch(src, /function ActionTrackerPanel/);
  assert.doesNotMatch(src, /function StatusTag/);
});

test("only the Health Facilities facility geography control is rendered", async () => {
  const src = await source();

  assert.match(src, /^ {2}facility: \{/m);
  assert.match(src, /hf: \["period", "facility"\]/);
  assert.doesNotMatch(src, /^ {2}(county|subcounty|ward):/m);
  assert.doesNotMatch(src, /"(county|subcounty|ward)"/);
});

test("no synthetic seed, multiplier or generated row survives", async () => {
  const src = await source();

  assert.doesNotMatch(src, /function buildData/);
  assert.doesNotMatch(src, /const FACTOR/);
  assert.doesNotMatch(src, /function scale\(/);
  assert.doesNotMatch(src, /function serviceRows/);
  assert.doesNotMatch(src, /function getServiceContent/);
  assert.doesNotMatch(src, /Operational checks/);
  assert.doesNotMatch(src, /ops-source-card/);
  assert.doesNotMatch(src, /cadence/);
});

test("all six data tabs are wired to their endpoints", async () => {
  const src = await source();

  for (const tabKey of ["summary", "labs", "poe", "hf", "community", "contacts"]) {
    assert.match(src, new RegExp(`operational/${tabKey}"`));
  }
  assert.match(src, /function useOperationalTab/);
  assert.match(src, /function ServiceDetailTab\(\{ activeTab, payload, onViewLinelist \}\)/);
  assert.match(src, /function SummaryTab\(\{ activeTab, payload, onViewLinelist \}\)/);
  assert.match(src, /function DataQualityPanel/);

  assert.doesNotMatch(src, /\b(gold|marts|silver|bronze)\./);
});

test("the summary tab renders the facility breakdown table", async () => {
  const body = summaryTabBody(await source());

  assert.match(body, /payload\.breakdown \?/);
  assert.match(body, /<ServiceTable breakdown=\{payload\.breakdown\}/);
  assert.match(body, /<h2>\{payload\.breakdown\.title\}<\/h2>/);
});

test("the summary plain-card grid is conditional, so no empty landmark ships", async () => {
  const body = summaryTabBody(await source());

  assert.match(body, /plainCards\.length > 0 \?/);
  const guard = body.indexOf("plainCards.length > 0 ?");
  const grid = body.indexOf('className="ops-plain-grid"');
  assert.notEqual(grid, -1, "the plain grid still exists");
  assert.ok(guard < grid, "the guard precedes the section it protects");
});

test("the summary redesign is scoped around the existing shared renderers", async () => {
  const body = summaryTabBody(await source());

  assert.match(
    body,
    /<section className="ops-summary" aria-label="Operational summary dashboard">/,
    "the non-empty Summary needs one labelled styling boundary",
  );
  assert.match(body, /importantCards\.map\(\(card\) => \(/);
  assert.match(body, /plainCards\.map\(\(card\) => \(/);
  assert.match(body, /payload\.charts\.map\(\(chart\) => \(/);
  assert.match(body, /<MetricCard[\s\S]*card=\{card\}/, "cards keep the shared MetricCard path");
  assert.match(body, /<ChartPanel key=\{chart\.key\}/, "charts keep the shared ChartPanel path");
  assert.match(body, /<ServiceTable breakdown=\{payload\.breakdown\}/, "the facility table keeps ServiceTable");
  assert.doesNotMatch(body, /\.sort\(|\.reverse\(/, "presentation must not reorder the payload");
  const styledBody = body.slice(body.indexOf('<section className="ops-summary"'));
  assert.doesNotMatch(
    styledBody,
    /ops-service-/,
    "the non-empty Summary markup must not borrow service-tab styling hooks",
  );

  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const scopedStart = css.indexOf("/* ---------- Operational Summary: meeting-approved survivor set ---------- */");
  const scopedEnd = css.indexOf("@media (max-width: 860px)", scopedStart);
  assert.notEqual(scopedStart, -1, "the Summary stylesheet boundary is declared");
  assert.notEqual(scopedEnd, -1, "the Summary stylesheet boundary is closed before shared breakpoints");
  const scopedCss = css.slice(scopedStart, scopedEnd);
  assert.match(scopedCss, /\.ops-summary/);
  assert.match(
    css,
    /\.ops-critical-grid \{\s*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/,
    "the supplied design uses three broad priority cards per row",
  );
  assert.match(
    scopedCss,
    /font-size:\s*var\(--fs-card-value-display\)/,
    "the Summary value must read its display scale from the role token, not restate a size",
  );
  assert.match(
    css,
    /--fs-card-value-display:\s*clamp\(2\.25rem, 3\.2vw, 3rem\)/,
    "the display-value token must keep the reference's clamp",
  );
  assert.doesNotMatch(
    scopedCss,
    /box-shadow:\s*0 8px 22px/,
    "the reference tile is flat — no lifted shadow",
  );
  assert.deepEqual(
    scopedCss.match(/^\s*min-height:/gm)?.length ?? 0,
    1,
    "only the Summary loading frame may declare a floor height",
  );
  assert.match(
    scopedCss,
    /\.ops-summary--loading \.ops-metric--important \{\s*min-height:/,
    "the loading frame is where that floor height belongs",
  );
  assert.doesNotMatch(
    scopedCss,
    /\.ops-service-/,
    "Summary presentation must not repurpose selectors shared by Laboratory, POE, or other tabs",
  );
});

test("the operational type scale is declared as role tokens and consumed under scope", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  const root = (css.match(/^:root \{[\s\S]*?\n\}/m) || [""])[0];
  assert.ok(root, ":root must be declared");
  for (const token of ["--fs-tab", "--control-h", "--fw-medium", "--fw-bold", "--color-ink"]) {
    assert.match(root, new RegExp(`${token}:`), `${token} must be declared once at :root`);
  }

  const scopedTab = (css.match(/\.ops-view-tabs \.tab \{[\s\S]*?\n\}/) || [""])[0];
  assert.ok(scopedTab, "the operational tab rule must be scoped to .ops-view-tabs");
  assert.match(scopedTab, /font-size:\s*var\(--fs-tab\)/, "the tab consumes the tab-size token");
  assert.match(
    scopedTab,
    /border:\s*0/,
    "the shared pill's border must be neutralised, not merely underlined over",
  );

  const scopedActive = (css.match(/\.ops-view-tabs \.tab--active \{[\s\S]*?\n\}/) || [""])[0];
  assert.ok(scopedActive, "the active-tab override must be scoped to .ops-view-tabs");
  assert.match(
    scopedActive,
    /border-bottom-color:\s*var\(--color-ink\)/,
    "the active tab's underline reads from the same ink token as its label, so the pair cannot drift",
  );
  assert.match(
    scopedActive,
    /box-shadow:\s*none/,
    "the base's inset shadow is the pill's bottom edge — left standing, the pill survives",
  );

  const sharedBase = (css.match(/\n\.tab \{[\s\S]*?\n\}/) || [""])[0];
  assert.match(
    sharedBase,
    /border-radius:\s*10px 10px 0 0/,
    "the shared base keeps the pill the public landing's tab row is designed around",
  );
});

test("the card tap-target floor is one token, at the WCAG AA minimum, described truthfully", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  const root = (css.match(/^:root \{[\s\S]*?\n\}/m) || [""])[0];
  assert.ok(root, ":root must be declared");
  assert.match(
    root,
    /--card-tap-target:\s*24px/,
    "the card tap-target floor is declared once at :root, at the 24px WCAG 2.5.8 Level AA minimum",
  );
  assert.strictEqual(
    (css.match(/--card-tap-target:/g) || []).length,
    1,
    "a second declaration means two cards can disagree about how big a tap target is",
  );

  const linelist = (css.match(/\n\.ops-metric__linelist \{[\s\S]*?\n\}/) || [""])[0];
  assert.ok(linelist, ".ops-metric__linelist must declare its own rule");
  assert.match(
    linelist,
    /min-height:\s*var\(--card-tap-target\)/,
    "the card link must read the shared floor, not restate a literal only it can see",
  );

  assert.doesNotMatch(
    root,
    /44px minimum/,
    "the --control-h comment's card-side claim was made false by this change and must not survive it",
  );
});

test("card vertical geometry comes from :root tokens, with no literal left at a use site", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  const root = (css.match(/^:root \{[\s\S]*?\n\}/m) || [""])[0];
  for (const token of [
    "--card-pad-y-tile",
    "--card-pad-y-plain",
    "--card-gap-value",
    "--card-gap-detail",
    "--card-gap-link",
    "--card-grid-gap",
    "--card-row-gap",
  ]) {
    assert.match(root, new RegExp(`${token}:`), `${token} must be declared at :root`);
    assert.strictEqual(
      (css.match(new RegExp(`${token}:`, "g")) || []).length,
      1,
      `${token} must be declared exactly once — a second home is a second answer`,
    );
  }

  const rule = (name) => (css.match(new RegExp(`\\n${name} \\{[^}]*\\}`)) || [""])[0];

  const tilePad = rule("\\.ops-metric--important > \\.ops-metric__content");
  assert.match(
    tilePad,
    /padding:\s*var\(--card-pad-y-tile\) 24px/,
    "the tile's vertical padding reads the token; its horizontal padding stays literal on purpose",
  );
  const plainPad = rule("\\.ops-metric--plain > \\.ops-metric__content");
  assert.match(plainPad, /padding:\s*var\(--card-pad-y-plain\) 20px/);

  assert.match(rule("\\.ops-metric strong"), /margin-top:\s*var\(--card-gap-value\)/);
  assert.match(rule("\\.ops-metric small"), /margin-top:\s*var\(--card-gap-detail\)/);
  assert.match(
    rule("\\.ops-metric__linelist"),
    /padding:\s*var\(--card-gap-link\) 0 0/,
    "the link's top gap is part of the shared rhythm, not a number local to the link",
  );
  assert.match(rule("\\.ops-pending"), /margin-top:\s*var\(--card-gap-value\)/);

  const scopedStart = css.indexOf("/* ---------- Operational Summary: meeting-approved survivor set ---------- */");
  const scopedEnd = css.indexOf("@media (max-width: 960px)", scopedStart);
  const scopedCss = css.slice(scopedStart, scopedEnd);
  assert.doesNotMatch(
    scopedCss,
    /\.ops-summary \.ops-metric--important > \.ops-metric__content \{/,
    "a scoped copy of the tile padding wins the cascade and reverts any change to the shared rule",
  );
  assert.doesNotMatch(
    scopedCss,
    /margin-top:\s*[1-9]/,
    "no vertical gap may be restated as a literal inside the Summary scope",
  );
  assert.doesNotMatch(
    scopedCss,
    /font-size:\s*0\.\d+rem/,
    "the Summary's detail and link sizes are role tokens (--fs-card-detail, --fs-inline-link), not literals",
  );

  assert.match(
    css,
    /\.ops-critical-grid,\n\.ops-plain-grid \{[^}]*gap:\s*var\(--card-grid-gap\)/,
    "card-to-card spacing reads one token for both rows",
  );
  const plainGridRules = css.match(/\.ops-plain-grid[^{]*\{[^}]*\}/g) || [];
  assert.ok(plainGridRules.length > 0, ".ops-plain-grid must be declared");
  for (const declared of plainGridRules) {
    assert.doesNotMatch(
      declared,
      /margin-top:\s*[1-9]/,
      "a margin here double-counts with .ops-summary's row gap — its only parent is that grid",
    );
  }
  assert.match(
    (css.match(/\n\.ops-summary \{[\s\S]*?\n\}/) || [""])[0],
    /gap:\s*var\(--card-row-gap\)/,
    "the Summary's section separation is declared once, on the grid that owns it",
  );
});

test("the plain card's detail clamps to one line, with the full text still reachable", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  const clamp = (css.match(/\n\.ops-metric--plain small \{[^}]*\}/) || [""])[0];
  assert.ok(clamp, ".ops-metric--plain small must declare the clamp");
  assert.match(clamp, /overflow:\s*hidden/);
  assert.match(clamp, /text-overflow:\s*ellipsis/);
  assert.match(clamp, /white-space:\s*nowrap/);

  const src = await source();
  assert.match(
    src,
    /function IndicatorBubble\(\{ text \}\)[\s\S]*?role="tooltip"/,
    "the clipped caption must still reach every user in full, or clamping loses data",
  );
  assert.match(
    src,
    /<IndicatorBubble text=\{description\} \/>/,
    "and the bubble must actually be rendered by the shared card content",
  );
});

test("the summary loading frame holds five cards, two charts, and the facility panel", async () => {
  const src = await source();
  const start = src.indexOf("function TabSkeleton(");
  const end = src.indexOf("\nfunction ", start + 1);
  const body = src.slice(start, end === -1 ? undefined : end);

  assert.match(body, /className="ops-summary ops-summary--loading"/);
  assert.match(body, /\[0, 1, 2, 3, 4\]\.map[\s\S]*emphasis="important"/);
  assert.match(body, /\[0, 1\]\.map[\s\S]*<h2>Summary chart<\/h2>/);
  assert.match(body, /<h2>Cases by health facility<\/h2>/);
  assert.doesNotMatch(body, /\[0, 1, 2, 3, 4, 5\][\s\S]*emphasis="plain"/);
});

test("the complete hero row is centered with its exact operational identity", async () => {
  const src = await source();
  const heroStart = src.indexOf('<section className="ops-hero">');
  const heroEnd = src.indexOf('<section className="ops-tab-shell">', heroStart);
  assert.notEqual(heroStart, -1, "the operational hero is declared");
  assert.notEqual(heroEnd, -1, "the operational hero ends before the tab shell");
  const hero = src.slice(heroStart, heroEnd);

  assert.match(
    hero,
    /Operational Dashboard\s*<br \/>\s*Staff Workspace/,
    "the approved two-line workspace identity must survive",
  );
  assert.match(
    hero,
    /className="ops-hero__copy"[\s\S]*className="hero-tile__actions"[\s\S]*<\/div>\s*<\/div>\s*<\/section>/,
    "the actions must be nested inside the centered copy container",
  );

  const actions = hero.indexOf('className="hero-tile__actions"');
  const asof = hero.indexOf('className="hero-tile__asof"', actions);
  const refresh = hero.indexOf("Refreshing…", actions);
  assert.ok(actions < asof && asof < refresh, "asof sits inside the actions, above Refresh");
});

test("the hero states the age of the data beside Refresh", async () => {
  const src = await source();

  assert.match(src, /className="hero-tile__asof"/);
  assert.match(src, /Data last updated/);
  assert.match(src, /formatDataAge\(/);
  assert.match(src, /meta\?\.lastUpdated/);

  assert.doesNotMatch(src, /Date\.now\(\)/);
  assert.doesNotMatch(src, /warehouseBuiltAt/);
});

test("the workspace and the linelist agree on the display time zone", async () => {
  const capture = /const DISPLAY_TIME_ZONE = "([^"]+)"/;

  const workspace = capture.exec(await source());
  const linelist = capture.exec(await linelistTableSource());

  assert.ok(workspace, "OperationalWorkspace declares DISPLAY_TIME_ZONE");
  assert.ok(linelist, "LinelistTable declares DISPLAY_TIME_ZONE");
  assert.equal(workspace[1], linelist[1]);
});

test("the two deleted community indicators leave nothing behind", async () => {
  const src = await source();

  assert.doesNotMatch(src, /Contacts traced/i);
  assert.doesNotMatch(src, /Unlinked signals/i);
});

test("each operational tab renders data filters for its own scope", async () => {
  const src = await source();

  assert.match(src, /const TAB_FILTERS = \{/);
  for (const key of ["summary", "labs", "poe", "hf", "community", "contacts"]) {
    assert.match(src, new RegExp(`${key}: \\[`));
  }
  assert.match(src, /function OperationalTabFilters/);
  assert.match(src, /className="ops-tab-filter-panel"/);
  assert.match(src, /aria-label=\{`\$\{activeTab\.label\} data filters`\}/);
  assert.doesNotMatch(src, /<h3>Useful filters<\/h3>/);
});

test("filter options come from gold, not from hard-coded arrays", async () => {
  const src = await source();

  assert.match(src, /operational\/filter-options/);
  assert.match(src, /function useFilterOptions/);
  assert.match(src, /useFilterOptions\(activeTab\.key\)/);
  assert.match(src, /MIN_OPTIONS_FOR_A_CONTROL/);

  for (const optionsKey of [
    "labs",
    "poes",
    "facilities",
    "communitySources",
  ]) {
    assert.match(src, new RegExp(`optionsKey: "${optionsKey}"`));
  }

  assert.doesNotMatch(
    src,
    /^ {2}(sampleSource|countryOrigin|destination|alertStatus|caseStatus|followUpStatus|riskLevel|pillar|owner|deadline|actionStatus|priority|resultStatus):/m,
  );
});

test("the period control offers six options including all time and a working custom range", async () => {
  const src = await source();

  for (const label of [
    "Last 24 hours",
    "Last 7 days",
    "Last 21 days",
    "Last 42 days",
    "All time",
    "Custom",
  ]) {
    assert.match(src, new RegExp(`"${label.replace(/\//g, "\\/")}"`));
  }
  assert.doesNotMatch(src, /Last 14 days/);
  assert.doesNotMatch(src, /Custom date\/time range/);

  assert.match(src, /function CustomRangeControl/);
  assert.match(src, /<CustomRangeControl/);
  assert.match(src, /type="datetime-local"/);
  assert.match(src, /The end must be on or after the start\./);
});

test("the custom range sits inside the filter row, on one line with the selects", async () => {
  const src = await source();

  const start = src.indexOf("function OperationalTabFilters(");
  assert.notEqual(start, -1, "OperationalTabFilters is missing");
  const end = src.indexOf("\nfunction ", start + 1);
  const body = src.slice(start, end === -1 ? undefined : end);

  assert.match(
    body,
    /fields\.flatMap\(/,
    "the filter row must be built as one list, or the range cannot sit beside the period control",
  );
  assert.match(
    body,
    /return \[[\s\S]{0,400}<CustomRangeControl/,
    "the range must be returned from inside the row builder, not appended after it",
  );

  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  const wrapper = (css.match(/\.ops-custom-range \{[\s\S]*?\}/) || [""])[0];
  assert.match(
    wrapper,
    /display:\s*contents/,
    ".ops-custom-range must be box-less so its inputs are members of the filter grid, not occupants of one cell",
  );
  assert.doesNotMatch(
    wrapper,
    /flex-wrap/,
    "a wrapping flex row inside one track is exactly what made From and To stack",
  );

  const hint = (css.match(/\.ops-custom-range__hint \{[\s\S]*?\}/) || [""])[0];
  assert.match(hint, /flex-basis:\s*100%/, "the hint must take its own full-width line");
  assert.match(
    hint,
    /order:\s*1/,
    "without the reorder the hint breaks the row before the reset, stranding it on a third line",
  );

  const panel = (css.match(/\.ops-tab-filter-panel \{[\s\S]*?\}/) || [""])[0];
  assert.match(panel, /display:\s*flex/, "the filter row must size itself from its content");
  assert.doesNotMatch(
    panel,
    /auto-fit|auto-fill/,
    "a container-driven track count plus a full-width hint is what collapsed the row to 150px columns",
  );

  const input = (css.match(/\.ops-custom-range input \{[\s\S]*?\}/) || [""])[0];
  assert.match(input, /width:\s*100%/, "each input must fill its track");
  assert.match(
    input,
    /min-width:\s*0/,
    "a native datetime-local must be allowed to shrink inside its track, or it widens the panel",
  );
});

test("every control in the filter row reads its height and size from one token", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  const select = (css.match(/\n\.ops-filter select \{[\s\S]*?\n\}/g) || []).at(-1) ?? "";
  const input = (css.match(/\.ops-custom-range input \{[\s\S]*?\n\}/) || [""])[0];
  const clear = (css.match(/\.ops-clear-filters \{[\s\S]*?\n\}/) || [""])[0];

  for (const [name, rule] of [
    ["the period/facility select", select],
    ["the custom-range input", input],
    ["the Clear filters reset", clear],
  ]) {
    assert.ok(rule, `${name} must declare its own control rule`);
    assert.match(
      rule,
      /min-height:\s*var\(--control-h\)/,
      `${name} must take the shared control height, not a literal of its own`,
    );
    assert.match(
      rule,
      /font-size:\s*var\(--fs-control\)/,
      `${name} must take the shared control size, not a literal of its own`,
    );
  }

  const label = (css.match(/\n\.ops-filter span \{[\s\S]*?\n\}/g) || []).at(-1) ?? "";
  assert.match(
    label,
    /font-size:\s*var\(--fs-control-label\)/,
    "the caption above each control reads from the control-label role token",
  );
  assert.match(
    label,
    /letter-spacing:\s*var\(--ls-label\)/,
    "the caption's tracking is the shared label tracking, not a per-surface guess",
  );
  const sharedLabelBlock = (
    css.match(/\.ops-login-form span,\s*\n\.ops-filter span \{[^}]*\}/) || [""]
  )[0];
  assert.ok(sharedLabelBlock, "the shared caption block must still exist for the login page");
  assert.doesNotMatch(
    sharedLabelBlock,
    /--fs-control-label|--control-h/,
    "the operational caption treatment must not be folded into the block the login page shares",
  );
});

test("the clear control sits inside the filter panel, level with the selects", async () => {
  const src = await source();

  const start = src.indexOf("function OperationalTabFilters(");
  assert.notEqual(start, -1, "OperationalTabFilters is missing");
  const end = src.indexOf("\nfunction ", start + 1);
  const body = src.slice(start, end === -1 ? undefined : end);

  assert.match(
    body,
    /Clear filters/,
    "the button must be emitted by the panel component, not rendered beside it on the page background",
  );
  assert.match(
    body,
    /ops-clear-filters/,
    "the button must keep its scoped skin class, or it falls back to bare .btn and reads as an unstyled pill",
  );
  assert.match(
    body,
    /onClick=\{onClear\}/,
    "the reset must arrive as a prop — the panel cannot see the workspace's clearFilters closure",
  );

  assert.match(
    src,
    /filtersDirty=\{filtersDirty\}/,
    "without this call-site prop the button silently never renders",
  );
  assert.match(
    src,
    /onClear=\{clearFilters\}/,
    "without this call-site prop the button renders but resets nothing",
  );
  assert.strictEqual(
    (src.match(/Clear filters/g) || []).length,
    1,
    "the standalone sibling must be deleted, not duplicated alongside the in-panel one",
  );

  assert.match(
    body,
    /disabled=\{!filtersDirty\}/,
    "the reset must be disabled when there is nothing to clear, not unmounted",
  );
  assert.doesNotMatch(
    body,
    /\{filtersDirty \?/,
    "conditionally mounting the reset is what made the row resize under the pointer",
  );

  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  const clear = (css.match(/\.ops-clear-filters \{[\s\S]*?\}/) || [""])[0];
  assert.match(
    clear,
    /align-self:\s*end/,
    "the caption-less button must bottom-align, or it floats above the selects it sits beside",
  );
  assert.match(
    clear,
    /border:\s*1px solid var\(--border\)/,
    "the button must carry the selects' border, or it reads as a grey pill dropped into the card",
  );
});

test("loading, pending, unavailable, empty and error are distinct states", async () => {
  const src = await source();

  assert.match(src, /aria-label="Not available"/);
  assert.match(src, /function PendingValue/);

  assert.match(src, /dataQualityStatus/);
  assert.match(src, /"unavailable"/);
  assert.doesNotMatch(src, /"stale"/);
  assert.match(src, /function isUnsourcedIndicator/);
  assert.match(src, /function isUnavailable/);

  assert.match(src, /components\/ui\/skeleton/);
  assert.match(src, /ops-skeleton--value-plain/);
  assert.match(src, /aria-busy/);
  assert.match(src, /aria-live="polite"/);

  assert.match(src, /No records in this selection/);
  assert.match(src, /Widen the period or clear a filter\./);
  assert.match(src, /Showing top /);

  assert.match(src, /Could not load \{activeTab\.title\} data\./);
  assert.match(src, /Your session has expired\. Sign in again\./);
  assert.match(src, /\/login\?next=\/operational/);
  assert.match(src, /Try again/);
  assert.match(src, /Refreshing…/);
  assert.match(src, /Clear filters/);
  assert.doesNotMatch(src, /window\.location\.reload/);
  assert.doesNotMatch(src, /ApiError\.message/);
});

test("a non-numeric cell in a live numeric column dashes, it never renders 0", async () => {
  const src = await source();

  const start = src.indexOf("function ServiceTable(");
  assert.notEqual(start, -1, "ServiceTable is missing");
  const end = src.indexOf("\nfunction ", start + 1);
  const body = src.slice(start, end === -1 ? undefined : end);

  assert.doesNotMatch(
    body,
    /typeof cell === "number" \? cell : 0/,
    "a null numeric cell must not fall back to 0 — that defeats D-35 suppression",
  );
  assert.match(
    body,
    /typeof cell === "number" \? \(\s*fmt\(cell\)\s*\) : \(/,
    "the numeric branch must format only real numbers",
  );
  assert.match(
    body,
    /typeof cell === "number"[\s\S]*?aria-label="Not available"/,
    "a non-numeric cell must render the same dash the pending columns use",
  );
});

test("both metric variants preserve the shared card breakdown content", async () => {
  const src = await source();

  const contentStart = src.indexOf("function MetricContent(");
  assert.notEqual(contentStart, -1, "MetricContent is missing");
  const contentEnd = src.indexOf("\nfunction ", contentStart + 1);
  const content = src.slice(contentStart, contentEnd === -1 ? undefined : contentEnd);

  assert.match(
    content,
    /<CardBreakdown entries=\{breakdown\} \/>/,
    "the shared card content must render D-30's suspected/probable breakdown",
  );

  for (const variant of ["ImportantMetric", "PlainMetric"]) {
    const start = src.indexOf(`function ${variant}(`);
    assert.notEqual(start, -1, `${variant} is missing`);
    const end = src.indexOf("\nfunction ", start + 1);
    const body = src.slice(start, end === -1 ? undefined : end);

    assert.match(body, /\{\s*[^}]*\bbreakdown\b/, `${variant} must accept the breakdown prop`);
    assert.match(body, /<MetricContent[\s\S]*?breakdown=\{breakdown\}/,
      `${variant} must pass the breakdown through the shared card content`);
  }

  assert.match(src, /breakdown=\{card\.breakdown\}/, "MetricCard must forward the breakdown");
});

test("cards, panel headings and table cells read from tokens, and table rules stay scoped", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  const plainValue = (css.match(/\.ops-metric--plain strong \{[^}]*\}/) || [""])[0];
  assert.match(
    plainValue,
    /font-size:\s*var\(--fs-card-value\)/,
    "the plain card's value reads the card-value role token",
  );
  assert.match(
    plainValue,
    /color:\s*var\(--color-ink\)/,
    "the base colour is navy; an alert-toned card still reddens through its is-{tone} class",
  );

  const pending = (css.match(/\n\.ops-pending \{[^}]*\}/) || [""])[0];
  assert.match(
    pending,
    /font-size:\s*var\(--fs-card-value\)/,
    "the dash must track the value it replaces, or the card changes height between states",
  );

  const panelHeading = (css.match(/\.ops-panel__head h2 \{[^}]*\}/) || [""])[0];
  assert.match(
    panelHeading,
    /font-size:\s*var\(--fs-panel-title\)/,
    "panel headings read one shared token, so no single panel can be a half-step off",
  );

  const cell = (css.match(/\.ops-panel \.data-table td \{[^}]*\}/) || [""])[0];
  assert.match(
    cell,
    /font-size:\s*var\(--fs-table-cell\)/,
    "operational table body cells read the table-cell role token",
  );
  const head = (css.match(/\.ops-panel \.data-table th \{[^}]*\}/) || [""])[0];
  assert.match(head, /font-size:\s*var\(--fs-table-head\)/);
  assert.match(head, /letter-spacing:\s*var\(--ls-label\)/);

  const firstColumn = (css.match(/\.ops-panel \.data-table td:first-child \{[^}]*\}/) || [""])[0];
  assert.match(firstColumn, /color:\s*var\(--color-ink\)/, "the row's subject reads as its label");
  assert.match(firstColumn, /font-weight:\s*var\(--fw-semibold\)/);

  for (const bare of [
    /\n\.data-table td \{[^}]*--fs-table/,
    /\n\.data-table th \{[^}]*--fs-table/,
    /\n\.data-table td:first-child \{/,
  ]) {
    assert.doesNotMatch(
      css,
      bare,
      "an unscoped .data-table rule reaches the users console and the linelist modal too",
    );
  }

  for (const [name, rule] of [
    [".ops-metric", (css.match(/\n\.ops-metric \{[^}]*\}/) || [""])[0]],
    [".ops-panel", (css.match(/\n\.ops-panel \{[^}]*\}/) || [""])[0]],
    [".ops-detail-head", (css.match(/\n\.ops-detail-head \{[^}]*\}/) || [""])[0]],
    [".ops-tab-filter-panel", (css.match(/\n\.ops-tab-filter-panel \{[^}]*\}/) || [""])[0]],
  ]) {
    assert.match(
      rule,
      /box-shadow:\s*none/,
      `${name} must declare its flatness rather than leaving a lift to be re-inherited`,
    );
  }
});

test("the ops stylesheet declares the states the workspace renders", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  for (const rule of [
    ".ops-pending",
    ".ops-skeleton--value-plain",
    ".ops-panel-empty",
    ".ops-truncation-note",
    ".ops-custom-range",
    ".ops-card-breakdown",
    ".ops-metric__label",
    ".ops-cell-label",
  ]) {
    assert.ok(css.includes(rule), `${rule} missing from globals.css`);
  }
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.ok(
    (css.match(/tabular-nums/g) || []).length >= 2,
    "numerals must be tabular on values and numeric cells",
  );
});

test("every scoped Summary tone keeps all cascade-card content readable", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  const important = (
    css.match(/\.ops-summary \.ops-metric--important \{[\s\S]*?\}/) || [""]
  )[0];
  assert.ok(important, "the scoped Summary priority-card rule must be declared");
  assert.match(important, /--ops-summary-bg:\s*var\(--color-surface\)/);
  assert.match(important, /--ops-summary-fg:\s*var\(--color-text\)/);
  assert.match(important, /background:\s*var\(--ops-summary-bg\)/);
  assert.match(important, /color:\s*var\(--ops-summary-fg\)/);

  for (const tone of ["red", "amber", "green", "blue", "navy"]) {
    const rule = (
      css.match(new RegExp(`\\.ops-summary \\.ops-metric--${tone} \\{[\\s\\S]*?\\}`)) || [""]
    )[0];
    assert.ok(rule, `Summary tone "${tone}" must be scoped and declared`);
    for (const role of ["bg", "fg", "muted", "hover", "focus"]) {
      assert.match(
        rule,
        new RegExp(`--ops-summary-${role}:`),
        `Summary tone "${tone}" must define its ${role} color role`,
      );
    }
  }

  const amber = (
    css.match(/\.ops-summary \.ops-metric--amber \{[\s\S]*?\}/) || [""]
  )[0];
  assert.match(
    amber,
    /--ops-summary-fg:\s*var\(--color-navy\)/,
    "the warning surface needs dark ink rather than insufficient-contrast white",
  );

  assert.match(
    css,
    /\.ops-summary \.ops-metric--important strong\.ops-pending \{[\s\S]*?color:\s*var\(--ops-summary-muted\)/,
    "the unavailable dash must use the tone's readable secondary foreground",
  );
  assert.match(
    css,
    /\.ops-summary \.ops-metric--important \.ops-card-breakdown span,[\s\S]*?\.ops-summary \.ops-metric--important \.ops-card-breakdown em[\s\S]*?color:\s*var\(--ops-summary-muted\)/,
    "breakdown labels and values must not inherit an invisible color",
  );
  assert.match(
    css,
    /\.ops-summary \.ops-metric__linelist:focus-visible,[\s\S]*?outline:\s*3px solid var\(--ops-summary-focus\)/,
    "the explicit View linelist action needs a visible tone-aware keyboard focus ring",
  );
});

test("From and To are always on screen and are filled from the window the server used", async () => {
  const src = await source();

  const filtersStart = src.indexOf("function OperationalTabFilters(");
  assert.notEqual(filtersStart, -1, "OperationalTabFilters is missing");
  const filtersEnd = src.indexOf("\nfunction ", filtersStart + 1);
  const filtersBody = src.slice(filtersStart, filtersEnd === -1 ? undefined : filtersEnd);

  assert.doesNotMatch(
    filtersBody,
    /CUSTOM_PERIOD_LABEL/,
    "the pickers must not be gated on the selected period; the constant stays live elsewhere, so scope this check to the row builder",
  );
  assert.match(
    filtersBody,
    /if \(fieldKey !== "period"\) return \[select\];/,
    "the only escape from the row builder is a non-period field — a second condition would hide the pickers again",
  );

  const workspaceStart = src.indexOf("export default function OperationalWorkspace(");
  assert.notEqual(workspaceStart, -1, "OperationalWorkspace is missing");
  const workspaceBody = src.slice(workspaceStart);

  assert.match(
    workspaceBody,
    /tab\.payload\?\.meta\?\.window/,
    "the fill reads the window the server actually queried, off the response payload",
  );
  assert.match(
    workspaceBody,
    /const period = PERIOD_OPTIONS\[filters\.period\];\s*\n\s*const span = PERIOD_SPAN_DAYS\[period\];/,
    "the span comes from the selected period, not from the served window's own width",
  );
  assert.match(
    workspaceBody,
    /period === "all" \? served\?\.from : shiftIsoDate\(latest, -span\)/,
    "for a bounded period the lower bound is the newest data minus that period — the served window.from is an envelope across five independently-anchored marts on Summary and can run 25x the period; All time is the one period that envelope actually describes",
  );
  assert.match(
    workspaceBody,
    /filters\.period === CUSTOM_PERIOD_LABEL/,
    "the echo must stand down while the custom period is selected, or a response clobbers bounds the user typed",
  );
  assert.match(
    workspaceBody,
    /T00:00/,
    "the mart serialises its bounds date-only, so the lower bound needs a midnight suffix for datetime-local",
  );
  assert.match(
    workspaceBody,
    /T23:59/,
    "the upper bound needs an end-of-day suffix, or an echoed same-day window selects nothing",
  );
  assert.match(
    workspaceBody,
    /function handleCustomRangeChange\([\s\S]*?period: CUSTOM_PERIOD_LABEL/,
    "only a user edit moves the dropdown to the custom entry; the fill never touches the period",
  );

  assert.doesNotMatch(
    src,
    /Date\.now\(\)|new Date\(\)/,
    "the window comes from the response, never from the browser clock — the warehouse anchor trails today by over a week",
  );
});
