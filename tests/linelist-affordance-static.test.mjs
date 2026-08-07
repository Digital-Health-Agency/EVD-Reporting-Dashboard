import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function source() {
  return readFile(new URL("../components/OperationalWorkspace.js", import.meta.url), "utf8");
}

function block(src, name) {
  const start = src.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} is missing`);
  const end = src.indexOf("\nfunction ", start + 1);
  return src.slice(start, end === -1 ? undefined : end);
}

test("the operational workspace imports the linelist mapping and modal", async () => {
  const src = await source();

  assert.match(src, /import \{\s*linelistFor,\s*rowLinelistEntry,\s*\} from "@\/components\/operational\/card-linelist-map";/);
  assert.match(src, /import LinelistModal from "@\/components\/operational\/LinelistModal";/);
});

test("eligible cards expose one visible linelist action without making the card clickable", async () => {
  const src = await source();
  const surface = block(src, "MetricSurface");

  assert.match(surface, /<div className="ops-metric__content">/);
  assert.match(surface, /className="ops-metric__linelist"/);
  assert.match(surface, /aria-label=\{`View linelist for \$\{label\}`\}/);
  assert.match(surface, /aria-describedby=\{description \? descriptionId : undefined\}/);
  assert.match(surface, /onClick=\{onViewLinelist\}/);
  assert.match(surface, />\s*View linelist →\s*<\/button>/);
  assert.doesNotMatch(surface, /className="ops-metric__button"|role="button"|tabIndex=|disabled/);

  const metricContent = block(src, "MetricContent");
  assert.match(metricContent, /id=\{description \? descriptionId : undefined\}/);
});

test("both metric variants delegate their contents and explicit action to the shared surface", async () => {
  const src = await source();

  for (const variant of ["ImportantMetric", "PlainMetric"]) {
    const body = block(src, variant);
    assert.match(body, /<MetricSurface[\s\S]*?>[\s\S]*?<MetricContent[\s\S]*?<\/MetricSurface>/);
  }

  assert.equal(
    (src.match(/<MetricSurface/g) || []).length,
    2,
    "both card variants must use the same static-card and explicit-action contract",
  );
});

test("unmapped cards render ordinary content without a linelist action", async () => {
  const src = await source();
  const surface = block(src, "MetricSurface");

  assert.match(surface, /<div className="ops-metric__content">[\s\S]*?\{children\}/);
  assert.match(surface, /\{linelistEntry \? \(/);
  assert.doesNotMatch(surface, /disabled|aria-disabled|hidden/);

  const metricCard = block(src, "MetricCard");
  assert.match(metricCard, /const linelistEntry = linelistFor\(tabKey, card\)/);
  assert.match(metricCard, /linelistEntry=\{linelistEntry\}/);
});

test("cards use the design's separate visible View linelist trigger", async () => {
  const src = await source();

  assert.match(src, /ops-metric__linelist/);
  assert.match(src, />\s*View linelist →\s*</);
  assert.doesNotMatch(src, /ops-metric__button/);
});

test("every MetricCard usage passes the active tab key", async () => {
  const src = await source();
  const usages = [...src.matchAll(/<MetricCard\b[^>]*\/>/g)].map((match) => match[0]);

  assert.ok(usages.length >= 3, "expected all three MetricCard rendering sites");
  for (const usage of usages) {
    assert.match(usage, /tabKey=\{activeTab\.key\}/);
  }
});

test("the workspace owns modal state and closes it when tab scope changes", async () => {
  const src = await source();

  assert.match(src, /const \[openLinelist, setOpenLinelist\] = useState\(null\)/);
  assert.match(src, /<LinelistModal[\s\S]*?open=\{Boolean\(openLinelist\)\}/);
  assert.match(
    src,
    /useEffect\(\(\) => \{\s*setOpenLinelist\(null\);\s*\}, \[activeTabKey, filters, customRange\]\);/,
  );
});

test("the hero copy accurately describes signed-in linelist access", async () => {
  const src = await source();

  assert.doesNotMatch(src, /No patient or contact line lists are shown\./);
  assert.match(src, /Record-level line lists are available to signed-in users\./);
});

test("the linelist interaction remains isolated from the public landing", async () => {
  const publicSource = await readFile(
    new URL("../components/PublicLanding.js", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(publicSource, /components\/operational|LinelistModal|\/linelist/);
});

test("the visible linelist action is styled without turning the card into a control", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const actionRule = (css.match(/\.ops-metric__linelist \{[\s\S]*?\}/) || [""])[0];

  assert.match(actionRule, /display:\s*inline-flex/);
  assert.match(actionRule, /align-self:\s*flex-start/);
  assert.match(actionRule, /min-height:\s*var\(--card-tap-target\)/);
  assert.match(actionRule, /margin-top:\s*auto/);
  assert.match(actionRule, /background:\s*transparent/);
  assert.match(actionRule, /cursor:\s*pointer/);
  assert.doesNotMatch(css, /\.ops-metric__button/);
});
