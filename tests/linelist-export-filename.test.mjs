import assert from "node:assert/strict";
import test from "node:test";

const exportModuleUrl = new URL("../lib/linelist-export.js", import.meta.url);

async function loadExportModule() {
  try {
    return await import(exportModuleUrl);
  } catch {
    return {};
  }
}

test("linelistExportFilename accepts only the D-15 attachment filename shape", async () => {
  const { linelistExportFilename } = await loadExportModule();
  assert.equal(typeof linelistExportFilename, "function");

  const expected = "evd-lab-results_2026-07-07_to_2026-07-28_exported-2026-08-05_by-u-1.csv";
  assert.equal(
    linelistExportFilename(`attachment; filename="${expected}"`),
    expected,
  );
  assert.equal(
    linelistExportFilename(`attachment; filename=${expected}`),
    expected,
  );

  const unknownActor = "evd-signals_2026-07-07_to_2026-07-28_exported-2026-08-05_by-unknown.csv";
  assert.equal(
    linelistExportFilename(`attachment; filename="${unknownActor}"`),
    unknownActor,
  );

  for (const disposition of [
    undefined,
    null,
    "",
    "inline; filename=evd-screenings_2026-07-07_to_2026-07-28_exported-2026-08-05_by-u-1.csv",
    "attachment",
    "attachment; filename=",
    "attachment; filename=evd-screenings_exported-2026-08-05.csv",
    "attachment; filename=evd-screenings_2026-02-30_to_2026-07-28_exported-2026-08-05_by-u-1.csv",
    "attachment; filename=../evd-screenings_2026-07-07_to_2026-07-28_exported-2026-08-05_by-u-1.csv",
    "attachment; filename=folder\\evd-screenings_2026-07-07_to_2026-07-28_exported-2026-08-05_by-u-1.csv",
    "attachment; filename=\"evd-screenings_2026-07-07_to_2026-07-28_exported-2026-08-05_by-u-1.csv\"junk",
    "attachment; filename=evd-screenings_2026-07-07_to_2026-07-28_exported-2026-08-05_by-u-1.csv\r\nX-Fake: yes",
    "attachment; filename=evd-screenings_2026-07-07_to_2026-07-28_exported-2026-08-05.csv",
    "attachment; filename=evd-screenings_2026-07-07_to_2026-07-28_exported-2026-08-05_by-Wanjiku.csv",
    "attachment; filename=evd-screenings_2026-07-07_to_2026-07-28_exported-2026-08-05_by-u@example.com.csv",
    "attachment; filename=evd-screenings_2026-07-07_to_2026-07-28_exported-2026-08-05_by-.csv",
  ]) {
    assert.equal(linelistExportFilename(disposition), null, String(disposition));
  }
});

test("exportLinelist initiates exactly one native navigation with paging removed", async () => {
  const { exportLinelist } = await loadExportModule();
  assert.equal(typeof exportLinelist, "function");

  const navigations = [];
  const result = exportLinelist(
    "screenings",
    {
      period: "21d",
      q: "Busia traveller",
      sortBy: "screened_at",
      sortDir: "asc",
      fields: "source_person_name,source_person_identifier,screened_at",
      screeningOutcome: "SUSPECTED,PROBABLE",
      page: 7,
      limit: 50,
      pageSize: 200,
    },
    { navigateImpl: (url) => navigations.push(url) },
  );

  assert.equal(result, undefined);
  assert.equal(navigations.length, 1);

  const url = new URL(navigations[0], "https://dashboard.example");
  assert.equal(url.pathname, "/api/operational/linelist/screenings/export");
  assert.deepEqual(
    Object.fromEntries(url.searchParams),
    {
      period: "21d",
      q: "Busia traveller",
      sortBy: "screened_at",
      sortDir: "asc",
      fields: "source_person_name,source_person_identifier,screened_at",
      screeningOutcome: "SUSPECTED,PROBABLE",
    },
  );
  assert.equal(url.searchParams.has("page"), false);
  assert.equal(url.searchParams.has("limit"), false);
  assert.equal(url.searchParams.has("pageSize"), false);
});

test("exportLinelist rejects invalid datasets and propagates initiation errors", async () => {
  const { exportLinelist } = await loadExportModule();
  assert.equal(typeof exportLinelist, "function");

  let navigations = 0;
  assert.throws(
    () => exportLinelist("../users", {}, { navigateImpl: () => { navigations += 1; } }),
    /dataset/i,
  );
  assert.equal(navigations, 0);

  const initiationError = new Error("navigation blocked");
  assert.throws(
    () => exportLinelist("signals", { period: "21d" }, {
      navigateImpl: () => {
        throw initiationError;
      },
    }),
    (caught) => caught === initiationError,
  );
});
