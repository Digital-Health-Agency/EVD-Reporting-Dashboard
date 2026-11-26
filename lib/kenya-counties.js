import { useEffect, useState } from "react";

/**
 * County-name matching and colour scale for the summary county map.
 *
 * Boundaries: public/kenya-counties.geojson (geoBoundaries KEN ADM1, from
 * RCMRD, public domain). Each feature has properties { name, code }.
 *
 * Warehouse counties arrive in mixed spellings ("NAIROBI", "Nairobi City",
 * "Murang'a", "Tharaka-Nithi"), so both sides are reduced to one key.
 */

// Spellings seen in source systems that the plain key does not join.
const COUNTY_ALIASES = Object.freeze({
  tharaka: "tharaka nithi",
  homabay: "homa bay",
  transnzoia: "trans nzoia",
  "trans zoia": "trans nzoia",
  uasingishu: "uasin gishu",
  "keiyo marakwet": "elgeyo marakwet",
  "elgeiyo marakwet": "elgeyo marakwet",
  taitataveta: "taita taveta",
  "taita": "taita taveta",
  "tana": "tana river",
  pokot: "west pokot",
});

export function countyKey(value) {
  const key = String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(county|city|government)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return COUNTY_ALIASES[key] || key;
}

/**
 * Join geography rows ({ name, filterValue, ...counts }) to county features.
 * Returns rows per feature key plus the rows no county could take (blank,
 * misspelt or foreign values), which the panel lists under the map.
 */
export function joinCountyRows(features, rows) {
  const known = new Map();
  for (const feature of Array.isArray(features) ? features : []) {
    known.set(countyKey(feature?.properties?.name), feature.properties.name);
  }

  const byCounty = new Map();
  const unmatched = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    const key = countyKey(row?.name);
    if (!row?.filterValue || !known.has(key)) {
      unmatched.push(row);
      continue;
    }
    // Two source spellings of one county: keep both filter values, sum counts.
    const current = byCounty.get(key);
    if (current) {
      for (const [field, value] of Object.entries(row)) {
        if (typeof value === "number") current[field] = (current[field] || 0) + value;
      }
      current.filterValues.push(row.filterValue);
    } else {
      byCounty.set(key, { ...row, name: known.get(key), filterValues: [row.filterValue] });
    }
  }
  return { byCounty, unmatched };
}

// Heat scale, yellow → orange → red (ColorBrewer YlOrRd): bright on the
// OpenStreetMap basemap and reads as "more cases" at a glance.
export const COUNTY_RAMP = Object.freeze(["#ffe066", "#ffb340", "#ff7a1a", "#f03b20", "#b10026"]);
export const COUNTY_ZERO_COLOR = "#e7e5e0";

/**
 * Up to five equal-interval classes from 1 to max. Zero is its own class
 * (COUNTY_ZERO_COLOR) so "no cases" never looks like "a few".
 * Each class is { from, to, color }.
 */
export function countyClasses(max) {
  const top = Math.max(0, Math.floor(Number(max) || 0));
  if (top === 0) return [];
  const count = Math.min(COUNTY_RAMP.length, top);
  const classes = [];
  let from = 1;
  for (let index = 1; index <= count; index += 1) {
    const to = index === count ? top : Math.ceil((top * index) / count);
    if (to < from) continue;
    classes.push({ from, to, color: null });
    from = to + 1;
  }
  // Spread the classes across the whole ramp so the darkest is always the max.
  classes.forEach((entry, index) => {
    const step =
      classes.length === 1
        ? 2
        : Math.round((index * (COUNTY_RAMP.length - 1)) / (classes.length - 1));
    entry.color = COUNTY_RAMP[step];
  });
  return classes;
}

export function countyColor(value, classes) {
  const amount = Number(value) || 0;
  if (amount <= 0) return COUNTY_ZERO_COLOR;
  const match = classes.find((entry) => amount >= entry.from && amount <= entry.to);
  return (match || classes[classes.length - 1])?.color || COUNTY_ZERO_COLOR;
}

// Boundary loader, shared by the panel and the map so the file is read once.
const KENYA_COUNTIES_URL = "/kenya-counties.geojson";

let cachedCounties = null;
let countiesPromise = null;

/** Shared loader so the map and the panel read the boundaries once. */
export function loadKenyaCounties() {
  if (cachedCounties) return Promise.resolve(cachedCounties);
  if (!countiesPromise) {
    countiesPromise = fetch(KENYA_COUNTIES_URL)
      .then((response) => (response.ok ? response.json() : null))
      .then((geo) => {
        cachedCounties = geo;
        return geo;
      })
      .catch(() => {
        countiesPromise = null;
        return null;
      });
  }
  return countiesPromise;
}

export function useKenyaCounties() {
  const [geo, setGeo] = useState(cachedCounties);
  useEffect(() => {
    let alive = true;
    loadKenyaCounties().then((loaded) => {
      if (alive && loaded) setGeo(loaded);
    });
    return () => {
      alive = false;
    };
  }, []);
  return geo;
}

