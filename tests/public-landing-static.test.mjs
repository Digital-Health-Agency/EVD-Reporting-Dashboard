import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public landing includes key metrics and public tabs", async () => {
  const source = await readFile(new URL("../components/PublicLanding.js", import.meta.url), "utf8");

  assert.match(source, /Key metrics/);
  assert.match(source, /public-tabs/);
  assert.match(source, /Highlights/);
  assert.match(source, /Cases/);
  assert.match(source, /Tests/);
  assert.match(source, /Contacts/);
  assert.match(source, /Alerts/);
  assert.match(source, /Points of entry/);
});
