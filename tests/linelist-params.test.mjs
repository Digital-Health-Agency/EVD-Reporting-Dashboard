import assert from "node:assert/strict";
import test from "node:test";

import { buildLinelistParams } from "../components/operational/card-linelist-map.js";

const entry = {
  predicate: { resultStatus: "NEGATIVE" },
};

test("buildLinelistParams preserves the tab window and protects the card predicate", () => {
  const tabParams = { period: "42d", county: "Nairobi", resultStatus: "POSITIVE" };
  const params = buildLinelistParams(entry, tabParams, {
    q: "  Jane Doe  ",
    page: 3,
    sortBy: "reporting_result_date",
    sortDir: "asc",
    fields: ["lab_result_key", "reporting_result_date"],
    defaults: ["lab_result_key"],
    resultStatus: "HOSTILE",
  });

  assert.deepEqual(params, {
    period: "42d",
    county: "Nairobi",
    resultStatus: "NEGATIVE",
    page: 3,
    q: "Jane Doe",
    sortBy: "reporting_result_date",
    sortDir: "asc",
    fields: "lab_result_key,reporting_result_date",
  });
  assert.deepEqual(tabParams, { period: "42d", county: "Nairobi", resultStatus: "POSITIVE" });
  assert.notEqual(params, tabParams);
  assert.equal(Object.hasOwn(params, "limit"), false);
});

test("buildLinelistParams omits blank search, unset sort, and the default projection", () => {
  for (const q of ["", "   "]) {
    const params = buildLinelistParams(entry, { period: "28d" }, {
      q,
      page: 1,
      sortBy: null,
      sortDir: null,
      fields: ["lab_result_key", "reporting_result_date"],
      defaults: ["lab_result_key", "reporting_result_date"],
    });

    assert.deepEqual(params, {
      period: "28d",
      resultStatus: "NEGATIVE",
      page: 1,
    });
    assert.equal(Object.hasOwn(params, "q"), false);
    assert.equal(Object.hasOwn(params, "sortBy"), false);
    assert.equal(Object.hasOwn(params, "sortDir"), false);
    assert.equal(Object.hasOwn(params, "fields"), false);
    assert.equal(Object.hasOwn(params, "limit"), false);
  }
});

test("buildLinelistParams returns a fresh object on every call", () => {
  const state = { q: "", page: 1, sortBy: null, sortDir: null, fields: undefined };
  const first = buildLinelistParams(entry, {}, state);
  const second = buildLinelistParams(entry, {}, state);

  assert.deepEqual(first, second);
  assert.notEqual(first, second);
});
