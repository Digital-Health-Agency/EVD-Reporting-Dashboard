import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

const IDENTIFYING_COLUMNS = [
  ["labResults", "subject_identifier"],
  ["screenings", "person_name"],
  ["screenings", "person_identifier"],
  ["cases", "source_person_name"],
  ["cases", "source_person_identifier"],
  ["outcomes", "source_person_name"],
  ["outcomes", "source_person_identifier"],
  ["contacts", "source_contact_name"],
  ["contacts", "source_contact_identifier"],
  ["signals", "signal_description"],
];

test("source inspection: the audit route reuses AdminGate rather than authoring a fourth gate", async () => {
  const [page, gates] = await Promise.all([
    source("../app/audit/page.js"),
    readdir(new URL("../components/auth/", import.meta.url)),
  ]);

  assert.match(page, /AdminGate/);
  assert.match(page, /<AdminGate>[\s\S]*<AuditEvents \/>[\s\S]*<\/AdminGate>/);
  assert.match(page, /components\/auth\/AdminGate/);
  assert.doesNotMatch(page, /isSurveillance/, "D-10 fixes this surface at admin");

  assert.deepEqual(
    gates.sort(),
    ["AdminGate.js", "AuthShell.js", "OperationalAuthGate.js", "ProfileGate.js"],
    "the audit screen reuses AdminGate; a fifth file here means a fourth gate was authored",
  );

  assert.strictEqual(
    (page.match(/function /g) || []).length,
    1,
    "the route is a shell — a second component here is a gate or a table growing a second home",
  );
});

test("source inspection: the audit screen reads one endpoint and writes nothing", async () => {
  const component = await source("../components/audit/AuditEvents.js");

  assert.match(component, /api\.get\("\/audit\/events"/);
  assert.doesNotMatch(
    component,
    /api\.(post|patch|delete|upload)\(/,
    "the audit trail is append-only on the server and read-only here",
  );
  assert.strictEqual(
    (component.match(/api\.\w+\(/g) || []).length,
    1,
    "one call, to one endpoint — a second is a second read channel",
  );

  assert.match(component, /catch \(caught\)/);
  assert.match(component, /setError\(caught instanceof Error \? caught\.message :/);
  assert.match(component, /embedded = false/, "the workspace mounts the same component");
});

test("source inspection: no free-text search over the stored filters payload is offered", async () => {
  const component = await source("../components/audit/AuditEvents.js");
  assert.match(component, /params\.eventType/);
  assert.match(component, /params\.actorId/);
  assert.doesNotMatch(component, /params\.(q|search)\b/);
  assert.doesNotMatch(component, /type="search"/);
  assert.match(
    component,
    /key !== SEARCH_LENGTH_KEY && key !== SEARCH_DIGEST_KEY/,
    "both search-shape keys must be excluded from the summarised key list",
  );
  assert.match(component, /`Search \(\$\{length\} characters\)`/, "a search shows its shape, not its term");
  assert.doesNotMatch(
    component,
    /JSON\.stringify\(/,
    "a raw dump of the filters payload invites a future reader to assume it is safe to widen",
  );
});

function outcomeTones(component) {
  const block = /const OUTCOME_TONES = \{([\s\S]*?)\};/.exec(component);

  assert.ok(block, "the outcome tones must be declared once, as a map");
  const tones = {};
  for (const [, key, tone] of block[1].matchAll(/(\w+):\s*"([\w-]+)"/g)) {
    tones[key] = tone;
  }
  return tones;
}

test("source inspection: an interrupted export is not toned as a refusal", async () => {
  const [component, css] = await Promise.all([
    source("../components/audit/AuditEvents.js"),
    source("../app/globals.css"),
  ]);

  const tones = outcomeTones(component);

  assert.ok(tones.aborted, "aborted must carry its own tone, not fall through");
  assert.notEqual(
    tones.aborted,
    tones.denied,
    "denied is the only outcome meaning nothing escaped; aborted delivered rows",
  );
  assert.notEqual(tones.aborted, tones.ok, "an interrupted export is not a clean one");

  for (const tone of new Set(Object.values(tones))) {
    assert.ok(
      css.includes(`.account-pill--${tone}`),
      `globals.css has no .account-pill--${tone} rule`,
    );
  }

  assert.match(component, /const tone = OUTCOME_TONES\[value\]/);
  assert.doesNotMatch(
    component,
    /value === "ok" \? "active" : "inactive"/,
    "the two-way ternary is what filed aborted under the refusal tone",
  );

  assert.match(component, /aborted: "Interrupted"/);
});

test("source inspection: the workspace carries an admin-only tab group, not a per-tab special case", async () => {
  const workspace = await source("../components/OperationalWorkspace.js");

  assert.match(workspace, /key: "audit"/);
  assert.match(workspace, /label: "Audit"/);
  assert.match(workspace, /<AuditEvents embedded \/>/);
  assert.match(workspace, /components\/audit\/AuditEvents/);

  const set = /const ADMIN_ONLY_TAB_KEYS = new Set\(\[([^\]]*)\]\)/.exec(workspace);
  assert.ok(set, "the admin-only tab keys must be declared once, as a set");
  assert.match(set[1], /"users"/);
  assert.match(set[1], /"audit"/);
  assert.match(workspace, /ADMIN_ONLY_TAB_KEYS\.has\(tab\.key\) \|\| isAdmin/);

  assert.doesNotMatch(
    workspace,
    /tab\.key !== "(users|audit)"/,
    "a per-key comparison is what a third admin tab would have to special-case again",
  );
});

test("source inspection: the account cell names the person and never shows a bare id", async () => {
  const component = await source("../components/audit/AuditEvents.js");

  assert.match(
    component,
    /<strong>\{event\.actorName \|\| event\.actorId \|\| EM_DASH\}<\/strong>/,
    "a deleted account must still be attributable by id, not blank and not 'Unknown'",
  );
  assert.doesNotMatch(
    component,
    /event\.actorName && event\.actorId/,
    "the id must not render alongside the name — a named actor shows a name only",
  );
  assert.match(component, /<RolePill role=\{event\.actorRole\} \/>/, "roles render as pills, not as a joined string");
  assert.doesNotMatch(
    component,
    /\{event\.actorRole \|\| EM_DASH\}/,
    "the raw comma-joined role string is what this replaced",
  );
});

test("source inspection: a role pill per held role, and an unparseable role is shown as recorded", async () => {
  const component = await source("../components/audit/AuditEvents.js");
  const css = await source("../app/globals.css");

  assert.match(component, /function RolePill\(/, "the account cell renders roles through a pill component");
  assert.match(
    component,
    /names\.map\(\(name\) => \(\s*<span className=\{`account-pill account-pill--\$\{name\}`\}/,
    "one pill per held role, keyed on the role name",
  );
  assert.doesNotMatch(
    component,
    /names\.length > 0 \? names : \["user"\]/,
    "an unparseable recorded role must not be rewritten to 'User' on an audit surface",
  );
  for (const role of ["user", "admin", "surveillance"]) {
    assert.ok(css.includes(`.account-pill--${role}`), `globals.css has no .account-pill--${role} rule`);
  }

  const group = css.match(/\.user-cell \.account-pill-group \{([^}]*)\}/);
  assert.ok(group, "globals.css has no .user-cell .account-pill-group rule");
  assert.match(group[1], /flex-wrap:\s*nowrap/, "role pills beside a name must not wrap one per line");
  const pill = css.match(/\.user-cell \.account-pill \{([^}]*)\}/);
  assert.ok(pill, "globals.css has no .user-cell .account-pill rule");
  assert.match(pill[1], /white-space:\s*nowrap/, "a role label must not break mid-word");
  assert.doesNotMatch(
    css,
    /^\.user-cell span \{/m,
    "the muted secondary-line rule must exclude pills, or it overrides their role colour",
  );
  assert.match(
    css,
    /\.user-cell span:not\(\.account-pill\):not\(\.account-pill-group\)/,
    "the secondary-line rule must exempt both the pill and its group",
  );
});

test("source inspection: labels are derived from the token, not looked up per column", async () => {
  const component = await source("../components/audit/AuditEvents.js");

  assert.match(component, /humanizeToken/);
  assert.match(component, /@\/lib\/format/, "the humanizer is shared, not a second copy here");
  assert.match(component, /humanizeToken\(event\.dataset\)/);
  assert.doesNotMatch(
    component,
    /const [A-Z_]*COLUMN[A-Z_]*(LABELS|NAMES) =/,
    "a per-column label map is a second naming source that goes stale",
  );
});

test("source inspection: the filters cell summarises keys and never a value", async () => {
  const component = await source("../components/audit/AuditEvents.js");

  assert.match(component, /Object\.keys\(filters\)/);
  assert.doesNotMatch(
    component,
    /Object\.(values|entries)\(filters\)/,
    "a filter value can carry a typed search term or a patient identifier",
  );

  const reads = component.match(/filters\[[^\]]+\]/g) || [];
  assert.deepEqual(
    [...new Set(reads)],
    ["filters[SEARCH_LENGTH_KEY]"],
    "no other key may be read out of the stored filters payload",
  );

  assert.match(component, /\.map\(baseFilterKey\)/);
  assert.match(component, /@\/lib\/format/, "the key helper is shared, not a second copy here");
  assert.match(component, /\[\.\.\.new Set\(named\)\]/, "one label per filter, not one per shape key");
});

test("source inspection: nothing on the audit screen can render an identifiable value", async () => {
  const sources = [
    ["components/audit/AuditEvents.js", await source("../components/audit/AuditEvents.js")],
    ["app/audit/page.js", await source("../app/audit/page.js")],
  ];

  assert.equal(IDENTIFYING_COLUMNS.length, 10);

  for (const [file, text] of sources) {
    for (const [dataset, column] of IDENTIFYING_COLUMNS) {
      assert.ok(
        !text.includes(column),
        `${file} names the ${dataset} identifying column ${column}; the audit screen renders metadata only`,
      );
    }
  }
});
