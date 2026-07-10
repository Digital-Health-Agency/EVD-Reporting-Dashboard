import assert from "node:assert/strict";
import test from "node:test";
import { formatLastUpdatedLabel } from "../lib/format.js";

test("formatLastUpdatedLabel shows 23:59 on the previous local day", () => {
  assert.equal(
    formatLastUpdatedLabel("2026-07-11T03:00:00+03:00"),
    "10 Jul 2026, 23:59",
  );
  assert.equal(
    formatLastUpdatedLabel("2026-07-11T00:00:00.000Z"),
    "10 Jul 2026, 23:59",
  );
  assert.equal(formatLastUpdatedLabel("invalid"), null);
});
