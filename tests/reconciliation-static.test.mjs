import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

const BARE_FETCH = /(?<![.\w])fetch\(/;

test("source inspection: the editor form keeps a blank blank and builds its payload in one place", async () => {
  const form = await source("../components/reconciliation/ReconciliationForm.js");

  assert.match(form, /inputMode="numeric"/);
  assert.doesNotMatch(
    form,
    /type="number"/,
    "a numeric-type input coerces a blank and spins on scroll; figures are text inputs",
  );

  assert.strictEqual(
    (form.match(/figuresToPayload\(/g) || []).length,
    1,
    "one call — a second path from the inputs to the request body is a second blank-vs-zero rule",
  );

  assert.match(form, /Leave a field blank if it was not reported/);
  assert.match(form, /Enter whole numbers of 0 or more/);
  assert.match(form, /Could not load warehouse figures\. Entered values can still be saved\./);
  assert.match(form, /Case fatality rate is calculated from deaths and confirmed cases/);

  assert.doesNotMatch(form, BARE_FETCH, "the form makes no request of its own");
  assert.doesNotMatch(form, /\bapi\.\w+\(/, "the pages own the requests");
  assert.doesNotMatch(form, /components\/operational/);
  assert.doesNotMatch(form, /Bulk|Import rows|Upload/, "manual entry only");
});

test("source inspection: a failed save is reported beside the save button", async () => {
  const [form, css] = await Promise.all([
    source("../components/reconciliation/ReconciliationForm.js"),
    source("../app/globals.css"),
  ]);

  assert.match(
    form,
    /<p className="form-alert" role="alert" ref=\{alertRef\}>\{failure\.message\}<\/p>\s*\) : null\}\s*<div className="form-actions" ref=\{actionsRef\}>/,
    "the alert sits directly above the buttons, where the person who pressed Save is looking",
  );
  assert.strictEqual(
    (form.match(/role="alert"/g) || []).length,
    1,
    "one save alert — a copy at the top of a 1,200px form is off screen",
  );
  assert.ok(form.indexOf("</table>") < form.indexOf('role="alert"'));
  assert.match(
    form,
    /actionsRef\.current\?\.scrollIntoView\(\{ block: "nearest" \}\);\s*alertRef\.current\?\.scrollIntoView\(\{ block: "nearest" \}\);/,
    "a save started with Enter from the top of the form still brings the alert on screen, and the alert must not push the button off it",
  );
  assert.match(form, /\}, \[failure\]\);/, "every failure scrolls, a repeated message included");
  assert.match(form, /setFailure\(\{ message, field \}\)/);

  assert.match(form, /aria-invalid=\{invalid\("situation_date"\)\}/);
  assert.match(form, /aria-invalid=\{invalid\(key\)\}/);
  assert.match(form, /return failure\?\.field === field \? "true" : undefined;/);
  assert.match(form, /Check \$\{fieldLabel\(result\.key\)\}\./, "the message names the field it is about");
  assert.match(
    form,
    /\.focus\(\{ preventScroll: true \}\)/,
    "moving focus must not scroll the alert away from the button",
  );

  assert.match(css, /\.console-form input\[aria-invalid="true"\] \{ border-color: var\(--color-alert\); \}/);
});

test("source inspection: the form holds input to the API limits and names the field the API rejects", async () => {
  const form = await source("../components/reconciliation/ReconciliationForm.js");

  assert.match(
    form,
    /id="source-label"\s+type="text"\s+maxLength=\{MAX_SOURCE_LENGTH\}/,
    "the API stops a source label at 200 characters",
  );
  assert.match(
    form,
    /id="row-notes"\s+type="text"\s+maxLength=\{MAX_NOTES_LENGTH\}/,
    "the API stops notes at 1000 characters",
  );
  assert.match(
    form,
    /catch \(caught\) \{\s*setFailure\(saveFailure\(caught\)\);/,
    "a rejected save names the field from the API's validation detail",
  );
  assert.match(
    form,
    /catch \(caught\) \{\s*setFailure\(saveFailure\(caught\)\);\s*setBusy\(false\);\s*\}/,
    "only a failed save gives the button back",
  );
  assert.doesNotMatch(form, /finally/, "a saved form stays busy until the route changes, so a second click sends nothing");
  assert.strictEqual((form.match(/setBusy\(false\)/g) || []).length, 1);
  assert.match(form, /disabled=\{busy\}/);
  for (const field of ["report_date", "source_label", "notes"]) {
    assert.ok(form.includes(`aria-invalid={invalid("${field}")}`), `${field} cannot be marked invalid`);
  }
});

test("source inspection: a new situation date cannot be after today in Nairobi", async () => {
  const form = await source("../components/reconciliation/ReconciliationForm.js");

  assert.match(
    form,
    /id="situation-date"\s+type="date"\s+required\s+max=\{initialRow \? undefined : nairobiToday\(\)\}/,
    "the picker stops at today",
  );
  assert.match(
    form,
    /if \(!initialRow && meta\.situation_date > nairobiToday\(\)\) \{\s*reject\("Situation date cannot be in the future\.", "situation_date", "situation-date"\);\s*return;/,
    "a typed date bypasses the picker, so the form checks again on save",
  );
  assert.ok(
    form.indexOf("Situation date cannot be in the future.") < form.indexOf("await onSubmit("),
    "the check runs before any request",
  );
  assert.doesNotMatch(form, /\bmin=\{/, "no lower bound — history from before the seed can still be entered");
});

test("source inspection: the add and edit routes are gated shells that call only the reconciliation API", async () => {
  const [addPage, editPage, gate] = await Promise.all([
    source("../app/reconciliation/new/page.js"),
    source("../app/reconciliation/[situationDate]/page.js"),
    source("../components/auth/ReconciliationGate.js"),
  ]);

  for (const [route, page] of [["new", addPage], ["[situationDate]", editPage]]) {
    assert.match(page, /<ReconciliationGate>[\s\S]*<ReconciliationForm[\s\S]*<\/ReconciliationGate>/, route);
    assert.match(page, /components\/auth\/ReconciliationGate/, route);
    assert.match(page, /<AppHeader variant="operational" \/>/, route);
    assert.strictEqual(
      (page.match(/function /g) || []).length,
      1,
      `${route}: the route is a shell — a second component here is a form growing a second home`,
    );
    assert.doesNotMatch(page, BARE_FETCH, `${route}: every request goes through the credentialed client`);
    assert.doesNotMatch(page, /components\/operational/, route);
    assert.match(page, /api\.get\("\/reconciliation\/warehouse"\)/, route);
  }

  assert.match(addPage, /api\.post\("\/reconciliation\/headline"/);
  assert.doesNotMatch(addPage, /api\.(patch|delete|upload)\(/);

  assert.match(editPage, /api\.patch\(/);
  assert.match(
    editPage,
    /const changes = changedFields\(row, next\);\s*if \(Object\.keys\(changes\)\.length > 0\) await api\.patch\(rowPath, \{ \.\.\.changes, expected_revision: row\.revision, expected_record_id: row\.record_id \}\);\s*router\.push\("\/reconciliation"\);/,
    "the edit sends only what changed since the row loaded, and nothing at all for an untouched form",
  );
  assert.strictEqual((editPage.match(/api\.patch\(/g) || []).length, 1);
  assert.doesNotMatch(
    editPage,
    /api\.patch\(rowPath, (next|body)/,
    "sending every field writes a stale figure back over another person's correction",
  );
  assert.match(editPage, /`\/reconciliation\/headline\/\$\{encodeURIComponent\(situationDate\)\}`/);
  assert.doesNotMatch(editPage, /api\.(post|delete|upload)\(/);
  assert.match(editPage, /Could not load official figures\./);

  assert.match(gate, /isReconciliation/);
  assert.doesNotMatch(gate, /isAdmin/, "D-10: admin alone does not get in");
});

test("source inspection: a background session refetch leaves the editor mounted", async () => {
  const gate = await source("../components/auth/ReconciliationGate.js");

  assert.match(
    gate,
    /if \(isPending \|\| \(isRefetching && !isAuthenticated\)\) \{/,
    "the loading card replaces the children only while there is no session yet",
  );
  assert.doesNotMatch(
    gate,
    /if \(isPending \|\| isRefetching\) \{/,
    "unmounting on every refetch discards figures typed but not yet saved",
  );
  assert.match(
    gate,
    /if \(isPending \|\| isRefetching \|\| isAuthenticated\) return;/,
    "the redirect still waits for the refetch to settle",
  );
  assert.ok(
    gate.indexOf("Checking access") < gate.indexOf("if (!isAuthenticated) return null;"),
    "the loading card is decided before the signed-out branch",
  );
});


test("CFR preview uses only entered figures because blank cumulative values may carry forward", async () => {
  const form = await source("../components/reconciliation/ReconciliationForm.js");
  assert.match(form, /deriveCfr\(enteredValue\("deaths"\), enteredValue\("confirmed_cases"\)\)/);
  assert.doesNotMatch(form, /enteredOrWarehouse/);
  assert.match(form, /From entered figures/);
});
