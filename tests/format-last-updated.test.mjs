import assert from "node:assert/strict";
import test from "node:test";
import { formatLastUpdatedLabel } from "../lib/format.js";

test("formatLastUpdatedLabel shows the latest day the figures cover", () => {
  assert.equal(
    formatLastUpdatedLabel("2026-07-11T03:00:00+03:00"),
    "11 Jul 2026",
  );
  assert.equal(
    formatLastUpdatedLabel("2026-07-11T00:00:00.000Z"),
    "11 Jul 2026",
  );
  assert.equal(formatLastUpdatedLabel("invalid"), null);
});

test("the label does not drift with the reader's timezone", () => {
  const original = process.env.TZ;
  try {
    for (const zone of ["UTC", "Africa/Nairobi", "America/Chicago", "Pacific/Auckland"]) {
      process.env.TZ = zone;
      assert.equal(
        formatLastUpdatedLabel("2026-08-11T00:00:00.000Z"),
        "11 Aug 2026",
        `label drifted in ${zone}`,
      );
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});
