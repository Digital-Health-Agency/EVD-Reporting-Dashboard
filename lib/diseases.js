// Single source of truth for the diseases the dashboard tracks.
//
// `tokens` are the raw, messy values seen in the warehouse (test_name /
// component_name). They are NOT SQL - the live adapter consumes these tokens to
// build its normalization expression; nothing here knows about ClickHouse.

/**
 * @typedef {Object} Disease
 * @property {string} key   URL/UI-safe identifier (e.g. "ebola").
 * @property {string} name  Canonical display + grouping name (e.g. "Ebola").
 * @property {string[]} tokens  Upper-cased raw values that normalize to this disease.
 * @property {string} color Accent colour used in the UI tabs/charts.
 */

/** @type {Disease[]} */
export const DISEASES = [
  {
    key: "ebola",
    name: "Ebola",
    tokens: ["EVD", "EBOLA", "EBOLA VIRUS"],
    color: "#0e6e63",
  },
  {
    key: "mpox",
    name: "Mpox",
    tokens: ["MPOX"],
    color: "#7c3aed",
  },
  {
    key: "marburg",
    name: "Marburg",
    tokens: ["MARBUG", "MARBURG", "MARBUG VIRUS", "MARBURG VIRUS"],
    color: "#b45309",
  },
];

export const DEFAULT_DISEASE = "ebola";

/** Resolve a URL/UI key (case-insensitive) to its Disease, or undefined. */
export function diseaseByKey(key) {
  if (!key) return undefined;
  const k = String(key).toLowerCase();
  return DISEASES.find((d) => d.key === k);
}

/** Resolve a canonical name to its Disease, or undefined. */
export function diseaseByName(name) {
  if (!name) return undefined;
  return DISEASES.find((d) => d.name === name);
}

/**
 * JS-side normalizer for a raw disease string (test_name / component_name).
 * Mirrors the live adapter's SQL logic for use outside of queries.
 * @returns {string} canonical disease name, or "Other".
 */
export function normalizeDisease(raw) {
  const v = String(raw || "").trim().toUpperCase();
  for (const d of DISEASES) {
    if (d.tokens.includes(v)) return d.name;
    if (d.tokens.some((t) => v.includes(t))) return d.name;
  }
  return "Other";
}
