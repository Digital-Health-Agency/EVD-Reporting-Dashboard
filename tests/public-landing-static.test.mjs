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
  assert.match(source, /No surveillance data reported yet\./);
  assert.doesNotMatch(source, /Last updated/);
  assert.match(source, /Last 24h/);
  assert.doesNotMatch(source, /Latest/);
  assert.match(source, /label="Confirmed"/);
  assert.match(source, /label="Total Screened"/);
  assert.doesNotMatch(source, /label="Recoveries"/);
  assert.match(source, /label="Deaths"/);
  assert.match(source, /Number\.isFinite\(cases\.deaths\)/);
  assert.match(source, /Number\.isFinite\(poe\.screeningPoints\)/);
  assert.doesNotMatch(source, /const deaths = 0\b/);
  assert.match(source, /label="People Tested"/);
  assert.match(source, /value=\{labs\.patientsTested\}/);
  assert.match(source, /label="Positive"/);
  assert.match(source, /value=\{fmt\(labs\.patientsPositive\)\}/);
  assert.doesNotMatch(source, /label="Negative"/);
  assert.doesNotMatch(source, /label="Tests done"/);
  assert.doesNotMatch(source, /label="Screening records"/);
  assert.match(source, /public-info/);
  assert.doesNotMatch(source, /public-view-tabs/);
  assert.doesNotMatch(source, /role="tablist"/);
  assert.doesNotMatch(source, /Highlights/);
  assert.doesNotMatch(source, /label: "Cases"/);
  assert.doesNotMatch(source, /Alerts/);
  assert.doesNotMatch(source, /Points of entry/);

  assert.match(source, /label="Contacts listed"/);
  assert.match(source, /value=\{cases\.contactsListed\}/);
  assert.match(source, /delta=\{cases\.newContacts24h\}/);
  assert.doesNotMatch(source, /contactsFollowedUp/);
  assert.doesNotMatch(source, /contact_registration_key|source_contact_name|source_contact_identifier/);
  assert.doesNotMatch(source, /\/linelist/);
  assert.doesNotMatch(source, /components\/operational/);
  assert.doesNotMatch(source, /LinelistModal|LinelistTable|LinelistPager|ColumnChooser|linelist-export/);
  assert.doesNotMatch(source, /operational\/linelist/);
});

test("public landing shows cases, people tested, deaths, contacts listed, then screening", async () => {
  const source = await readFile(new URL("../components/PublicLanding.js", import.meta.url), "utf8");
  const titles = [...source.matchAll(/<MetricCard tone="\w+" icon="\w+" title="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(titles, ["Cases", "People Tested", "Deaths", "Contacts Listed", "Screening"]);
  assert.match(source, /delta=\{cases\.newDeaths24h\}/);
  assert.match(source, /delta=\{labs\.newPatientsTested24h\}/);
});

test("every card shows a 14-day daily trend with weekday and date ticks", async () => {
  const source = await readFile(new URL("../components/PublicLanding.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /const TREND_DAYS = 14;/);
  assert.equal([...source.matchAll(/<DailyTrend/g)].length, 5);
  assert.match(source, /dailyTrendPoints\(labs\.daily, today, \(point\) => \(\{ value: point\.people/);
  assert.match(source, /dailyTrendPoints\(poe\.trend,/);
  assert.match(source, /values\.get\(key\) \|\| \{ value: 0, extra: 0 \}/);
  assert.match(source, /No new \{noun\} in the last 14 days\./);
  assert.match(source, /metric-trend__tick-date/);
  assert.doesNotMatch(source, /weeklyTrendPoints|WeeklyTrend|ScreeningTrend/);
  for (const tone of ["deaths", "cases", "tests", "contacts"]) {
    assert.match(css, new RegExp(`\\.metric-trend--${tone}\\s*\\{`), `no .metric-trend--${tone} rule`);
  }
});

test("trend bars show their figure on hover and on keyboard focus", async () => {
  const source = await readFile(new URL("../components/PublicLanding.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /indicator-tooltip__bubble--chart/);
  assert.match(source, /\{fmt\(point\.value\)\}<\/strong> \{noun\}/);
  assert.match(source, /tabIndex=\{0\}/);
  assert.doesNotMatch(source, /title=\{`\$\{point\.label\}/);

  assert.match(css, /\.indicator-tooltip__bubble--chart\s*\{/);
  assert.match(css, /\.metric-trend__slot:first-child \.indicator-tooltip__bubble--chart\s*\{/);
  assert.match(css, /\.metric-trend__slot:last-child \.indicator-tooltip__bubble--chart\s*\{/);
});

test("metric values keep their tone colour and sit beside their label", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.doesNotMatch(css, /\.metric-stat dd\s*\{/);
  assert.match(css, /\.metric-stat__value\s*\{/);
  for (const tone of ["positive", "negative", "warning"]) {
    assert.match(
      css,
      new RegExp(`\\.metric-stat__value--${tone}\\s*\\{`),
      `globals.css has no .metric-stat__value--${tone} rule`,
    );
  }

  assert.match(css, /\.metric-stat\s*\{[^}]*max-width:/);
  assert.match(css, /\.metric-stat--wide\s*\{[^}]*max-width:\s*min\(/);
});

test("only the authenticated operational app route may import operational components", async () => {
  for (const file of await routeFiles()) {
    const route = relative(appRoot, file);
    if (route.startsWith("operational/")) continue;

    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /components\/operational/, route);
  }
});
