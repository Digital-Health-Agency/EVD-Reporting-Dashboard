export const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "--");
export const pct = (n) => `${(n * 100).toFixed(1)}%`;
export const splitText = (obj) => `M ${fmt(obj.male)} | F ${fmt(obj.female)}`;

const LAST_UPDATED_FORMAT = { dateStyle: "medium", timeStyle: "short" };

/** Show the reporting cut-off as 23:59 on the day before lastUpdated. */
export function formatLastUpdatedLabel(iso) {
  const source = new Date(iso);
  if (Number.isNaN(source.getTime())) return null;

  const cutoff = new Date(source);
  cutoff.setDate(cutoff.getDate() - 1);
  cutoff.setHours(23, 59, 0, 0);

  return cutoff.toLocaleString("en-KE", LAST_UPDATED_FORMAT);
}
