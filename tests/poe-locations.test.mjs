import test from "node:test";
import assert from "node:assert/strict";
import {
  POE_LOCATIONS,
  buildPoeMarkers,
  resolvePoeLocation,
} from "../lib/poe-locations.js";

// Display names produced by the warehouse `uhai_point_of_entry_name` macro.
const WAREHOUSE_POE_NAMES = [
  "Jomo Kenyatta International Airport",
  "Busia OSBP",
  "Moi International Airport",
  "Lwakhakha Border Post",
  "Eldoret International Airport",
  "Kisumu International Airport",
  "Isebania OSBP",
  "Wajir Airport",
  "Malaba OSBP",
  "Isiolo International Airport",
  "Wilson International Airport",
  "Namanga OSBP",
  "Mbita",
  "Suam Border Post",
  "Malindi Airport",
  "Old Seaport",
  "Muhuru-bay",
  "Nadapal Border Post",
  "Lunga-lunga OSBP",
  "Moyale OSBP",
  "Kilindini Sea Port",
  "Taveta OSBP",
];

test("every warehouse POE name resolves to itself", () => {
  for (const name of WAREHOUSE_POE_NAMES) {
    assert.equal(resolvePoeLocation(name)?.name, name, name);
  }
});

test("raw Uhai codes and short names resolve", () => {
  assert.equal(resolvePoeLocation("jkia").name, "Jomo Kenyatta International Airport");
  assert.equal(resolvePoeLocation("JKIA").type, "Air");
  assert.equal(resolvePoeLocation("kia_kisumu").name, "Kisumu International Airport");
  assert.equal(resolvePoeLocation("Kisumu Pier").name, "Kisumu Pier");
  assert.equal(resolvePoeLocation("Malindi Port").type, "Sea");
  assert.equal(resolvePoeLocation("Malindi Airport").type, "Air");
  assert.equal(resolvePoeLocation("Namanga").type, "Land");
});

test("unknown and unrecorded POEs are not placed on the map", () => {
  assert.equal(resolvePoeLocation("Not recorded"), null);
  assert.equal(resolvePoeLocation(""), null);
  assert.equal(resolvePoeLocation(null), null);
  assert.equal(resolvePoeLocation("Somewhere Else"), null);
});

test("all locations sit inside Kenya's bounding box", () => {
  for (const location of POE_LOCATIONS) {
    assert.ok(location.lat >= -4.8 && location.lat <= 5.1, location.name);
    assert.ok(location.lng >= 33.8 && location.lng <= 42.1, location.name);
    assert.ok(["Air", "Sea", "Land"].includes(location.type), location.name);
  }
});

test("buildPoeMarkers merges aliases and reports unmapped rows", () => {
  const { markers, unmapped } = buildPoeMarkers([
    { name: "Jomo Kenyatta International Airport", screened: 10 },
    { name: "JKIA", screened: 5 },
    { name: "Busia OSBP", screened: 3 },
    { name: "Not recorded", screened: 4 },
    { name: "Mystery Post", screened: 2 },
    { name: "Mystery Zero", screened: 0 },
  ]);
  assert.deepEqual(
    markers.map((m) => [m.name, m.screened]),
    [
      ["Jomo Kenyatta International Airport", 15],
      ["Busia OSBP", 3],
    ],
  );
  assert.deepEqual(unmapped, [
    { name: "Not recorded", screened: 4 },
    { name: "Mystery Post", screened: 2 },
  ]);
});

// Every other name gold.report_screening produced for travellers (Nov 2026),
// with the pin it should land on. "Unknown" is deliberately left off the map.
const WAREHOUSE_ALIAS_NAMES = {
  Loitoktok: "Loitokitok Border",
  "Loitokitok Border": "Loitokitok Border",
  "Kilindini Land": "Kilindini Land",
  Naivasha: "Naivasha ICD",
  "Lokichogio Airport": "Lokichoggio Airport",
  "Ukunda Airport": "Ukunda Airport",
  Vanga: "Vanga",
  Mandera: "Mandera Border",
  Shimoni: "Shimoni Sea Port",
  "Lamu Seaport": "Lamu Sea Port",
  Liboi: "Liboi Border",
  Garissa: "Garissa",
  "Sand River Gate": "Sand River Gate",
  "Ngomeni Border": "Ngomeni Border",
  Kiunga: "Kiunga Border",
  "Kisumu Pier": "Kisumu Pier",
  "Malindi Port": "Malindi Port",
};

test("every other warehouse POE name lands on the right pin", () => {
  for (const [name, pin] of Object.entries(WAREHOUSE_ALIAS_NAMES)) {
    assert.equal(resolvePoeLocation(name)?.name, pin, name);
  }
  assert.equal(resolvePoeLocation("Unknown"), null);
});

test("Kilindini land and sea screenings stay separate pins", () => {
  const { markers } = buildPoeMarkers([
    { name: "Kilindini Sea Port", filterValue: "Kilindini Sea Port", screened: 98 },
    { name: "Kilindini Land", filterValue: "Kilindini Land", screened: 853 },
  ]);
  assert.deepEqual(
    markers.map((m) => [m.name, m.type]),
    [
      ["Kilindini Land", "Land"],
      ["Kilindini Sea Port", "Sea"],
    ],
  );
});

test("markers keep the data's POE name and rows for linelist links", () => {
  const { markers } = buildPoeMarkers([
    { name: "Lokichogio Airport", filterValue: "Lokichogio Airport", screened: 78 },
  ]);
  assert.equal(markers[0].name, "Lokichogio Airport");
  assert.deepEqual(markers[0].rows, [
    { name: "Lokichogio Airport", filterValue: "Lokichogio Airport", screened: 78 },
  ]);
});
