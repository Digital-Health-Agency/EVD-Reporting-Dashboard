export const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "--");
export const pct = (n) => `${(n * 100).toFixed(1)}%`;
export const splitText = (obj) => `M ${fmt(obj.male)} | F ${fmt(obj.female)}`;

const ABBREVIATIONS = new Set(["poe", "mfl", "evd", "id", "sms", "url"]);

export function humanizeToken(value) {
  if (typeof value !== "string") return "";
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  const spelled = words.map((word) =>
    ABBREVIATIONS.has(word.toLowerCase()) ? word.toUpperCase() : word.toLowerCase(),
  );
  const [head, ...tail] = spelled;
  return [head.charAt(0).toUpperCase() + head.slice(1), ...tail].join(" ");
}

const SHAPE_SUFFIXES = ["Length", "Sha256"];

export function baseFilterKey(key) {
  if (typeof key !== "string") return "";
  const suffix = SHAPE_SUFFIXES.find(
    (candidate) => key.endsWith(candidate) && key.length > candidate.length,
  );
  return suffix ? key.slice(0, -suffix.length) : key;
}

const LAST_UPDATED_FORMAT = { dateStyle: "medium", timeZone: "UTC" };

export function formatLastUpdatedLabel(iso) {
  const source = new Date(iso);
  if (Number.isNaN(source.getTime())) return null;

  return source.toLocaleDateString("en-KE", LAST_UPDATED_FORMAT);
}
