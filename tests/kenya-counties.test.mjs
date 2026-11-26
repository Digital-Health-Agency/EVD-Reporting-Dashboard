import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  COUNTY_RAMP,
  COUNTY_ZERO_COLOR,
  countyClasses,
  countyColor,
  countyKey,
  joinCountyRows,
} from "../lib/kenya-counties.js";

const geo = JSON.parse(
  fs.readFileSync(new URL("../public/kenya-counties.geojson", import.meta.url), "utf8"),
);
const features = geo.features;

test("the boundary file has Kenya's 47 counties with unique keys", () => {
  assert.equal(features.length, 47);
  const keys = new Set(features.map((feature) => countyKey(feature.properties.name)));
  assert.equal(keys.size, 47);
});

// County spellings seen in gold case, outcome and screening tables (Nov 2026)
// plus common variants from other sources.
test("warehouse county spellings join to a boundary", () => {
  const { byCounty, unmatched } = joinCountyRows(
    features,
    [
      "nairobi", "NAIROBI", "Uasin Gishu", "homa bay", "Taita Taveta", "tharaka nithi",
      "Tharaka-Nithi", "Murang'a", "Muranga", "Elgeyo Marakwet", "Elgeyo-Marakwet",
      "Nairobi City", "Trans Nzoia", "West Pokot", "Kisii", "Nyamira",
    ].map((name, index) => ({ name, filterValue: `v${index}`, alerts: 1 })),
  );
  assert.deepEqual(unmatched, []);
  assert.equal(byCounty.get("nairobi").alerts, 3);
  assert.deepEqual(byCounty.get("nairobi").filterValues, ["v0", "v1", "v11"]);
  assert.equal(byCounty.get("nairobi").name, "Nairobi");
  assert.equal(byCounty.get(countyKey("Murang'a")).alerts, 2);
});

test("blank and foreign counties stay off the map", () => {
  const { byCounty, unmatched } = joinCountyRows(features, [
    { name: "Not recorded", filterValue: null, alerts: 2 },
    { name: "kampala", filterValue: "kampala", alerts: 1 },
    { name: "busia", filterValue: "busia", alerts: 7 },
  ]);
  assert.deepEqual([...byCounty.keys()], ["busia"]);
  assert.deepEqual(unmatched.map((row) => row.name), ["Not recorded", "kampala"]);
});

test("classes cover 1..max and the darkest step is the max", () => {
  assert.deepEqual(countyClasses(0), []);
  assert.deepEqual(countyClasses(1).map((c) => [c.from, c.to]), [[1, 1]]);
  const classes = countyClasses(25);
  assert.equal(classes.length, 5);
  assert.equal(classes[0].from, 1);
  assert.equal(classes.at(-1).to, 25);
  assert.equal(classes.at(-1).color, COUNTY_RAMP.at(-1));
  for (let i = 1; i < classes.length; i += 1) {
    assert.equal(classes[i].from, classes[i - 1].to + 1);
  }
  assert.deepEqual(countyClasses(3).map((c) => [c.from, c.to]), [[1, 1], [2, 2], [3, 3]]);
});

test("zero is grey and never shares a colour with a count", () => {
  const classes = countyClasses(9);
  assert.equal(countyColor(0, classes), COUNTY_ZERO_COLOR);
  assert.notEqual(countyColor(1, classes), COUNTY_ZERO_COLOR);
  assert.equal(countyColor(9, classes), COUNTY_RAMP.at(-1));
});
