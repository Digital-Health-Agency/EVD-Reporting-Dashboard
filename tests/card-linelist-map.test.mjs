import assert from "node:assert/strict";
import test from "node:test";

import {
  CARD_LINELIST_MAP,
  DATASET_PATHS,
  linelistFor,
} from "../components/operational/card-linelist-map.js";

const SHIPPING_KEYS = [
  "labs.testsDone",
  "labs.positiveTests",
  "labs.negativeTests",
  "poe.travellersScreened",
  "hf.alerts",
  "contacts.contactsListed",
  "community.signalsReported",
  "community.signalsVerified",
  "summary.alerts",
  "summary.confirmedCases",
  "summary.deaths",
  "summary.recovered",
];

const WITHHELD_KEYS = [
  "hf.confirmed",
  "hf.currentAdmitted",
  "hf.recovered",
  "hf.deaths",
  "contacts.dueToday",
  "contacts.reached",
  "contacts.symptomatic",
  "summary.signalsVerified",
  "summary.contactsDueToday",
  "summary.contactsFollowedUp",
  "summary.casesForReview",
  "summary.samplesCollected",
  "summary.onTreatment",
  "summary.travellersScreened",
];

const DATASETS = new Set([
  "labResults",
  "screenings",
  "cases",
  "outcomes",
  "contacts",
  "signals",
]);

test("the authored map contains exactly the live-reconciled shipping keys", () => {
  assert.deepEqual(Object.keys(CARD_LINELIST_MAP).sort(), [...SHIPPING_KEYS].sort());
  for (const key of WITHHELD_KEYS) {
    assert.equal(Object.hasOwn(CARD_LINELIST_MAP, key), false, key);
  }
});

test("every map entry names a valid dataset, predicate, label, and noun", () => {
  for (const [key, entry] of Object.entries(CARD_LINELIST_MAP)) {
    assert.equal(DATASETS.has(entry.dataset), true, `${key} dataset`);
    assert.equal(Object.getPrototypeOf(entry.predicate), Object.prototype, `${key} predicate`);
    assert.equal(typeof entry.listLabel, "string", `${key} listLabel`);
    assert.notEqual(entry.listLabel.trim(), "", `${key} listLabel`);
    assert.equal(typeof entry.noun, "string", `${key} noun`);
    assert.notEqual(entry.noun.trim(), "", `${key} noun`);
    assert.equal(typeof DATASET_PATHS[entry.dataset], "string", `${key} path`);
    assert.notEqual(DATASET_PATHS[entry.dataset].trim(), "", `${key} path`);
  }
});

test("Health Facilities alerts use the facility screening scope", () => {
  assert.deepEqual(CARD_LINELIST_MAP["hf.alerts"], {
    dataset: "screenings",
    predicate: { screeningScope: "facility", screeningFlagged: "true" },
    listLabel: "Facility screening alerts",
    noun: "screenings",
  });
});

test("community verified signals use the verified boolean predicate", () => {
  assert.deepEqual(CARD_LINELIST_MAP["community.signalsVerified"], {
    dataset: "signals",
    predicate: { signalVerified: "true" },
    listLabel: "Verified community signals",
    noun: "community signals",
  });
});

test("an eligible live card resolves to its authored entry", () => {
  const card = {
    key: "testsDone",
    value: 187,
    provenance: { source: "live" },
    meta: { dataQualityStatus: "ok" },
  };

  assert.equal(linelistFor("labs", card), CARD_LINELIST_MAP["labs.testsDone"]);
});

test("cards with no measured value do not expose a linelist", () => {
  assert.equal(linelistFor("labs", { key: "testsDone", value: null }), null);
  assert.equal(linelistFor("labs", { key: "testsDone", value: undefined }), null);
});

test("pending and unavailable cards do not expose a linelist", () => {
  const base = { key: "testsDone", value: 187 };

  assert.equal(linelistFor("labs", { ...base, provenance: { source: "pending" } }), null);
  assert.equal(
    linelistFor("labs", { ...base, meta: { dataQualityStatus: "unavailable" } }),
    null,
  );
});

test("a card over an unrefreshed mart stays drillable", () => {
  assert.equal(
    linelistFor("labs", {
      key: "testsDone",
      value: 187,
      provenance: { source: "live" },
      meta: { dataQualityStatus: "provisional", lastUpdated: "2026-07-28T13:28:11Z" },
    }),
    CARD_LINELIST_MAP["labs.testsDone"],
  );
});

test("a measured zero remains drillable", () => {
  const card = {
    key: "positiveTests",
    value: 0,
    provenance: { source: "live" },
    meta: { dataQualityStatus: "ok" },
  };

  assert.equal(linelistFor("labs", card), CARD_LINELIST_MAP["labs.positiveTests"]);
});

test("an unmapped card does not expose a linelist", () => {
  assert.equal(
    linelistFor("labs", {
      key: "notMapped",
      value: 1,
      provenance: { source: "live" },
      meta: { dataQualityStatus: "ok" },
    }),
    null,
  );
});
