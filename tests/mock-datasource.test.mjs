import assert from "node:assert/strict";
import test from "node:test";

import * as mock from "../lib/datasource/mock.js";

test("mock adapter returns coherent bounded sections", async () => {
  const [labs, cases, poe, overview] = await Promise.all([
    mock.lab("Ebola"),
    mock.cases("Ebola"),
    mock.poe(),
    mock.testsByDisease(),
  ]);

  assert.equal(mock.name, "mock");
  assert.equal(labs.available, true);
  assert.equal(cases.available, true);
  assert.equal(poe.available, true);

  assert.equal(labs.testsDone, labs.positive + labs.negative + labs.inconclusive);
  assert.equal(labs.trend.length, 14);
  assert.ok(labs.newTested24h >= 0);

  assert.ok(cases.confirmed >= cases.deaths);
  assert.ok(cases.confirmed >= cases.recoveries);
  assert.ok(cases.newConfirmed24h <= cases.confirmed);
  assert.ok(cases.contactsFollowedUp <= cases.contactsListed);

  assert.ok(poe.byPoe.length >= 8);
  assert.equal(
    poe.totalScreened,
    poe.byPoe.reduce((sum, row) => sum + row.screened, 0)
  );

  assert.ok(Array.isArray(overview));
  assert.ok(overview.some((row) => row.disease === "Ebola" && row.total > 0));
});

test("mock adapter returns fresh values across calls", async () => {
  const first = await mock.lab("Ebola");
  const second = await mock.lab("Ebola");

  assert.notDeepEqual(
    {
      testsDone: first.testsDone,
      trend: first.trend,
    },
    {
      testsDone: second.testsDone,
      trend: second.trend,
    }
  );
});
