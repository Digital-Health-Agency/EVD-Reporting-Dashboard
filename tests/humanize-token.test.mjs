import assert from "node:assert/strict";
import test from "node:test";
import { baseFilterKey, humanizeToken } from "../lib/format.js";

test("humanizeToken turns machine tokens into sentence case", () => {
  assert.equal(humanizeToken("source_person_name"), "Source person name");
  assert.equal(humanizeToken("initialClassification"), "Initial classification");
  assert.equal(humanizeToken("cases"), "Cases");
  assert.equal(humanizeToken("case_investigation"), "Case investigation");
  assert.equal(humanizeToken("sortDir"), "Sort dir");
  assert.equal(humanizeToken("turnaround-band"), "Turnaround band");
});

test("humanizeToken keeps known abbreviations upper case", () => {
  assert.equal(humanizeToken("poe"), "POE");
  assert.equal(
    humanizeToken("reporting_requesting_facility_mfl"),
    "Reporting requesting facility MFL",
  );
});

test("humanizeToken derives a label rather than looking one up", () => {
  assert.equal(humanizeToken("newly_added_column"), "Newly added column");
  assert.equal(humanizeToken("brandNewFilterKey"), "Brand new filter key");
});

test("humanizeToken yields an empty string for a missing token", () => {
  assert.equal(humanizeToken(""), "");
  assert.equal(humanizeToken(undefined), "");
  assert.equal(humanizeToken(null), "");
  assert.equal(humanizeToken(42), "");
});

test("baseFilterKey recovers the filter name behind a stored shape key", () => {
  assert.equal(baseFilterKey("labSha256"), "lab");
  assert.equal(baseFilterKey("labLength"), "lab");
  assert.equal(baseFilterKey("qSha256"), "q");
  assert.equal(baseFilterKey("initialClassificationSha256"), "initialClassification");
});

test("baseFilterKey leaves a filter stored verbatim alone", () => {
  for (const key of ["period", "sortDir", "from", "to", "screeningScope"]) {
    assert.equal(baseFilterKey(key), key);
  }
  assert.equal(baseFilterKey("Length"), "Length");
  assert.equal(baseFilterKey("Sha256"), "Sha256");
});

test("baseFilterKey and humanizeToken name the filter, never its value", () => {
  const labels = ["labLength", "labSha256"].map((key) =>
    humanizeToken(baseFilterKey(key)),
  );
  assert.deepEqual([...new Set(labels)], ["Lab"]);
});
