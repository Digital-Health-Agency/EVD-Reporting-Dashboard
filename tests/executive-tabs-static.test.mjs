import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("executive dashboard exposes persistent Dashboard and POE tabs", async () => {
  const source = await readFile(new URL("../components/DashboardShell.js", import.meta.url), "utf8");

  assert.match(source, /aria-label="Executive dashboard views"/);
  assert.match(source, /className="executive-hero"/);
  assert.match(source, /Executive Situation Brief/);
  assert.match(source, /label: "Dashboard"/);
  assert.match(source, /label: "POE"/);
  assert.match(source, /role="tablist"/);
  assert.match(source, /aria-selected=\{view === tab\.key\}/);
  assert.doesNotMatch(source, /setView\(\(v\)/);
  assert.doesNotMatch(source, />\{view === "map" \? "Dashboard" : "POE map"\}</);
});

test("POE tab includes map plus executive information cards", async () => {
  const source = await readFile(new URL("../components/DashboardShell.js", import.meta.url), "utf8");

  assert.match(source, /function PoeExecutiveView/);
  assert.match(source, /<PoeBubbleMap byPoe=\{byPoe\}/);
  assert.match(source, /aria-label="POE executive metrics"/);
  assert.match(source, /Screening records/);
  assert.match(source, /Unique travellers/);
  assert.match(source, /Reporting POEs/);
  assert.match(source, /Top reporting points of entry/);
});

test("POE map keeps edge labels inside the SVG viewBox", async () => {
  const source = await readFile(new URL("../components/PoeBubbleMap.js", import.meta.url), "utf8");

  assert.match(source, /if \(lx < 8\)/);
  assert.match(source, /if \(lx > VIEW_W - 8\)/);
});
