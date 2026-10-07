import { baseFilterKey, humanizeToken } from "./format.js";

const VALUE_KEYS = new Set(["period", "sortDir", "screeningScope", "screeningFlagged", "signalVerified", "sortBy"]);
const DATE_VALUE = /^\d{4}-\d{2}-\d{2}(?:[T ][\d:.]+)?(?:Z|[+-]\d{2}:?\d{2})?$/;

// Free text is stored as length/digest metadata. Never render a raw search value,
// digest, or an unexpected legacy payload as an audit value.
export function auditFilterEntries(filters) {
  if (!filters || typeof filters !== "object") return [];
  return Object.entries(filters).flatMap(([key, value]) => {
    if (key.endsWith("Sha256")) return [];
    if (key.endsWith("Length")) return [[key === "qLength" ? "Search" : humanizeToken(baseFilterKey(key)), `Redacted (${value} characters)`]];
    if (VALUE_KEYS.has(key) && ["string", "boolean", "number"].includes(typeof value)) return [[humanizeToken(key), String(value)]];
    if (["from", "to"].includes(key) && typeof value === "string" && DATE_VALUE.test(value)) return [[humanizeToken(key), value]];
    return [[humanizeToken(key), "Value not retained"]];
  });
}
