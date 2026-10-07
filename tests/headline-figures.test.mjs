import assert from "node:assert/strict";
import test from "node:test";
import {
  GROUP_LABELS,
  HEADLINE_FIGURE_FIELDS,
  MAX_FIGURE,
  MAX_NOTES_LENGTH,
  MAX_SOURCE_LENGTH,
  changedFields,
  deriveCfr,
  fieldLabel,
  figureDifference,
  figuresToPayload,
  formatSigned,
  formatSituationDate,
  nairobiToday,
  parseFigureInput,
  saveFailure,
} from "../lib/headline-figures.js";

const CUMULATIVE_KEYS = [
  "confirmed_cases",
  "recoveries",
  "deaths",
  "samples_tested_total",
  "positive_samples",
  "negative_samples",
  "travellers_screened_total",
  "screening_points",
  "contacts_listed",
];

const LAST_24H_KEYS = [
  "confirmed_cases_24h",
  "samples_tested_24h",
  "travellers_screened_24h",
];

const fieldByKey = (key) => HEADLINE_FIGURE_FIELDS.find((field) => field.key === key);

test("the catalogue lists nine cumulative figures then three last-24-hours figures", () => {
  assert.equal(HEADLINE_FIGURE_FIELDS.length, 12);
  assert.equal(HEADLINE_FIGURE_FIELDS[8]?.key, "contacts_listed");
  assert.deepEqual(
    HEADLINE_FIGURE_FIELDS.slice(0, 9).map((field) => field.key),
    CUMULATIVE_KEYS,
  );
  assert.deepEqual(
    HEADLINE_FIGURE_FIELDS.slice(9).map((field) => field.key),
    LAST_24H_KEYS,
  );
  assert.deepEqual(
    HEADLINE_FIGURE_FIELDS.map((field) => field.group),
    [...Array(9).fill("cumulative"), ...Array(3).fill("last24h")],
  );
});

test("every catalogue entry carries its workbook label, tooltip and payload key", () => {
  assert.equal(HEADLINE_FIGURE_FIELDS.length, 12);
  for (const field of HEADLINE_FIGURE_FIELDS) {
    assert.ok(field.label?.trim(), `${field.key} has no label`);
    assert.ok(field.tooltip?.trim(), `${field.key} has no tooltip`);
    assert.match(field.payloadKey ?? "", /^(cases|labs|poe)\.[A-Za-z0-9]+$/, `${field.key} has no payload key`);
  }

  assert.equal(fieldByKey("confirmed_cases")?.label, "Confirmed cases");
  assert.equal(fieldByKey("confirmed_cases")?.tooltip, "Total confirmed cases to date.");
  assert.equal(fieldByKey("confirmed_cases")?.payloadKey, "cases.confirmed");
  assert.equal(fieldByKey("confirmed_cases_24h")?.label, "New confirmed (24h)");
  assert.equal(
    fieldByKey("confirmed_cases_24h")?.tooltip,
    "Confirmed cases reported in the last 24 hours. Do not sum across dates.",
  );
  assert.equal(fieldByKey("screening_points")?.payloadKey, "poe.screeningPoints");
  assert.equal(fieldByKey("deaths")?.payloadKey, "cases.deaths");
  assert.equal(fieldByKey("samples_tested_total")?.label, "Samples tested");
  assert.equal(fieldByKey("travellers_screened_24h")?.payloadKey, "poe.newScreened24h");
});

test("the derived fatality rate has no catalogue entry", () => {
  assert.equal(HEADLINE_FIGURE_FIELDS.length, 12);
  for (const field of HEADLINE_FIGURE_FIELDS) {
    assert.doesNotMatch(`${field.key} ${field.label} ${field.payloadKey}`, /fatality|cfr/i);
  }
});

test("the group labels name the two workbook groups in order", () => {
  assert.deepEqual(GROUP_LABELS, {
    cumulative: "Cumulative to date",
    last24h: "Last 24 hours",
  });
  assert.deepEqual(Object.keys(GROUP_LABELS), ["cumulative", "last24h"]);
});

test("parseFigureInput reads a blank as not reported", () => {
  assert.deepEqual(parseFigureInput(""), { ok: true, value: null });
  assert.deepEqual(parseFigureInput("   "), { ok: true, value: null });
});

test("parseFigureInput keeps a typed zero as zero", () => {
  assert.deepEqual(parseFigureInput("0"), { ok: true, value: 0 });
});

test("parseFigureInput accepts whole numbers with separators and padding", () => {
  assert.deepEqual(parseFigureInput("652,584"), { ok: true, value: 652584 });
  assert.deepEqual(parseFigureInput(" 28 "), { ok: true, value: 28 });
});

test("parseFigureInput rejects anything that is not a whole number of 0 or more", () => {
  for (const value of ["-1", "1.5", "abc", "1e3", "+4", "12abc"]) {
    assert.deepEqual(parseFigureInput(value), { ok: false }, `accepted ${value}`);
  }
  assert.equal(parseFigureInput("-1").ok, false);
});

test("parseFigureInput rejects a number too large to hold exactly", () => {
  assert.deepEqual(parseFigureInput("9007199254740993"), { ok: false });
});

test("parseFigureInput stops at the largest figure the API stores", () => {
  assert.equal(MAX_FIGURE, 2147483647);
  assert.deepEqual(parseFigureInput("2147483647"), { ok: true, value: 2147483647 });
  assert.deepEqual(parseFigureInput("2,147,483,647"), { ok: true, value: 2147483647 });
  assert.deepEqual(parseFigureInput("2147483648"), { ok: false });
  assert.deepEqual(parseFigureInput("2,147,483,648"), { ok: false });
  assert.deepEqual(parseFigureInput("9".repeat(400)), { ok: false });
});

test("figuresToPayload names a figure above the ceiling", () => {
  assert.deepEqual(
    figuresToPayload({ confirmed_cases: "1", travellers_screened_total: "6525840000" }),
    { ok: false, key: "travellers_screened_total" },
  );
});

test("the text limits match the API's", () => {
  assert.equal(MAX_SOURCE_LENGTH, 200);
  assert.equal(MAX_NOTES_LENGTH, 1000);
});

test("fieldLabel names the row fields and every figure, and nothing else", () => {
  assert.equal(fieldLabel("situation_date"), "Situation date");
  assert.equal(fieldLabel("report_date"), "Report date");
  assert.equal(fieldLabel("source_label"), "Source");
  assert.equal(fieldLabel("notes"), "Notes");
  for (const { key, label } of HEADLINE_FIGURE_FIELDS) assert.equal(fieldLabel(key), label);
  for (const key of ["case_fatality_rate", "constructor", "toString", "", undefined, null, 0]) {
    assert.equal(fieldLabel(key), null, `labelled ${String(key)}`);
  }
});

test("saveFailure names the field the API rejected", () => {
  const caught = Object.assign(new Error("Validation failed"), {
    status: 400,
    body: {
      message: "Validation failed",
      errors: [
        { code: "too_big", path: ["notes"], message: "Too big: expected string to have <=1000 characters" },
        { code: "too_big", path: ["deaths"], message: "Too big: expected number to be <=2147483647" },
      ],
    },
  });

  assert.deepEqual(saveFailure(caught), {
    message: "Unable to save figures. Check Notes. Too big: expected string to have <=1000 characters",
    field: "notes",
  });
});

test("saveFailure names the field even when the API gives no detail", () => {
  const caught = Object.assign(new Error("Validation failed"), { body: { errors: [{ path: ["deaths"] }] } });

  assert.deepEqual(saveFailure(caught), { message: "Unable to save figures. Check Deaths.", field: "deaths" });
});

test("saveFailure falls back to the API message when no field is named", () => {
  const conflict = Object.assign(new Error("A row for 2026-10-06 already exists. Edit it instead."), {
    status: 409,
    body: { message: "A row for 2026-10-06 already exists. Edit it instead." },
  });
  assert.deepEqual(saveFailure(conflict), {
    message: "Unable to save figures. A row for 2026-10-06 already exists. Edit it instead.",
  });

  for (const errors of [[], [{ path: [] }], [{ path: ["case_fatality_rate"] }], [{}], "nope"]) {
    const caught = Object.assign(new Error("Validation failed"), { body: { errors } });
    assert.deepEqual(saveFailure(caught), { message: "Unable to save figures. Validation failed" });
  }

  assert.deepEqual(saveFailure("offline"), { message: "Unable to save figures." });
  assert.deepEqual(saveFailure(undefined), { message: "Unable to save figures." });
});

test("figuresToPayload maps every figure and fills absent keys with null", () => {
  const result = figuresToPayload({ confirmed_cases: "1", deaths: "", recoveries: "0" });

  assert.equal(result?.ok, true);
  assert.deepEqual(Object.keys(result.payload), [...CUMULATIVE_KEYS, ...LAST_24H_KEYS]);
  assert.equal(result.payload.confirmed_cases, 1);
  assert.equal(result.payload.deaths, null);
  assert.equal(result.payload.recoveries, 0);
  for (const key of [...CUMULATIVE_KEYS, ...LAST_24H_KEYS]) {
    if (key === "confirmed_cases" || key === "recoveries") continue;
    assert.equal(result.payload[key], null, `${key} should be null`);
  }
});

test("figuresToPayload names the first invalid field", () => {
  assert.deepEqual(figuresToPayload({ deaths: "-1" }), { ok: false, key: "deaths" });
  assert.deepEqual(
    figuresToPayload({ travellers_screened_24h: "x", recoveries: "1.5" }),
    { ok: false, key: "recoveries" },
  );
});

const LOADED_ROW = {
  situation_date: "2026-10-06",
  report_date: "2026-10-07",
  source_label: "CS press release 6 Oct 2026",
  notes: null,
  confirmed_cases: 1,
  confirmed_cases_24h: 1,
  recoveries: 0,
  deaths: 1,
  samples_tested_total: 267,
  samples_tested_24h: null,
  positive_samples: 1,
  negative_samples: 266,
  travellers_screened_total: 652584,
  travellers_screened_24h: null,
  screening_points: null,
  contacts_listed: 28,
  updatedBy: "user-1",
  updatedAt: "2026-10-07T05:00:00.000Z",
};

function submitted(overrides = {}) {
  const { situation_date: _key, updatedBy: _by, updatedAt: _at, ...fields } = LOADED_ROW;
  return { ...fields, ...overrides };
}

test("changedFields is empty for a form saved untouched", () => {
  assert.deepEqual(changedFields(LOADED_ROW, submitted()), {});
});

test("changedFields keeps only the fields that differ from the loaded row", () => {
  assert.deepEqual(changedFields(LOADED_ROW, submitted({ notes: "imported case" })), {
    notes: "imported case",
  });
  assert.deepEqual(changedFields(LOADED_ROW, submitted({ deaths: 2, contacts_listed: 31 })), {
    deaths: 2,
    contacts_listed: 31,
  });
});

test("changedFields sends a cleared field as null and a typed zero as zero", () => {
  assert.deepEqual(changedFields(LOADED_ROW, submitted({ deaths: null })), { deaths: null });
  assert.deepEqual(changedFields(LOADED_ROW, submitted({ confirmed_cases: 0 })), { confirmed_cases: 0 });
  assert.deepEqual(changedFields(LOADED_ROW, submitted({ screening_points: 0 })), { screening_points: 0 });
  assert.deepEqual(changedFields(LOADED_ROW, submitted({ source_label: null })), { source_label: null });
});

test("changedFields does not report a stored zero or a stored blank as a change", () => {
  assert.deepEqual(changedFields(LOADED_ROW, submitted({ recoveries: 0, samples_tested_24h: null })), {});
  assert.deepEqual(changedFields({ ...LOADED_ROW, notes: undefined }, submitted()), {});
});

test("changedFields treats every submitted field as new when no row was loaded", () => {
  assert.deepEqual(changedFields(null, { deaths: 1, notes: null }), { deaths: 1 });
});

test("figureDifference is entered minus warehouse", () => {
  assert.equal(figureDifference(652584, 0), 652584);
  assert.equal(figureDifference(0, 3), -3);
});

test("figureDifference is null when either side is missing", () => {
  assert.equal(figureDifference(null, 3), null);
  assert.equal(figureDifference(3, null), null);
  assert.equal(figureDifference(undefined, undefined), null);
});

test("formatSigned shows the direction of a difference", () => {
  assert.equal(formatSigned(652584), "+652,584");
  assert.equal(formatSigned(-3), "−3");
  assert.equal(formatSigned(0), "0");
});

test("formatSigned never shows a missing difference as zero", () => {
  assert.equal(formatSigned(null), "—");
});

test("deriveCfr is deaths over confirmed as a one-decimal percentage", () => {
  assert.equal(deriveCfr(1, 1), 100);
  assert.equal(deriveCfr(0, 5), 0);
  assert.equal(deriveCfr(2, 3), 66.7);
});

test("deriveCfr is undefined without confirmed cases or a deaths figure", () => {
  assert.equal(deriveCfr(1, 0), null);
  assert.equal(deriveCfr(null, 5), null);
  assert.equal(deriveCfr(1, null), null);
});

test("nairobiToday is the calendar date in Africa/Nairobi", () => {
  assert.equal(nairobiToday(new Date("2026-10-06T20:59:59Z")), "2026-10-06");
  assert.equal(nairobiToday(new Date("2026-10-06T21:00:00Z")), "2026-10-07");
  assert.equal(nairobiToday(new Date("2026-12-31T21:00:00Z")), "2027-01-01");
  assert.equal(nairobiToday(new Date("2026-03-04T09:00:00Z")), "2026-03-04");
  assert.match(nairobiToday(), /^\d{4}-\d{2}-\d{2}$/);
});

test("nairobiToday does not follow the reader's timezone", () => {
  const original = process.env.TZ;
  try {
    for (const zone of ["UTC", "America/Chicago", "Pacific/Auckland"]) {
      process.env.TZ = zone;
      assert.equal(nairobiToday(new Date("2026-10-06T21:30:00Z")), "2026-10-07", `drifted in ${zone}`);
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test("formatSituationDate shows the weekday and the full date", () => {
  const label = formatSituationDate("2026-10-06");

  assert.match(String(label), /6 Oct 2026/);
  assert.match(String(label), /^[A-Z][a-z]{2}\b/);
});

test("formatSituationDate leaves an unreadable date unchanged", () => {
  assert.equal(formatSituationDate("not-a-date"), "not-a-date");
});

test("the situation date does not drift with the reader's timezone", () => {
  const original = process.env.TZ;
  try {
    for (const zone of ["UTC", "Africa/Nairobi", "America/Chicago", "Pacific/Auckland"]) {
      process.env.TZ = zone;
      assert.match(
        String(formatSituationDate("2026-10-06")),
        /Tue,? 6 Oct 2026/,
        `label drifted in ${zone}`,
      );
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});


test("stale edit offers a reload without treating a duplicate date as stale", () => {
  const stale = Object.assign(new Error("This record changed since you opened it."), { status: 409 });
  assert.equal(saveFailure(stale).conflict, true);
  assert.match(saveFailure(stale).message, /Your entries are still here/);
  const duplicate = Object.assign(new Error("A row already exists. Edit it instead."), { status: 409 });
  assert.equal(saveFailure(duplicate).conflict, undefined);
  assert.match(saveFailure(duplicate).message, /already exists/);
});
