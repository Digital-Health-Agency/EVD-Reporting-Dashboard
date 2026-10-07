export const GROUP_LABELS = {
  cumulative: "Cumulative to date",
  last24h: "Last 24 hours",
};

export const HEADLINE_FIGURE_FIELDS = [
  {
    key: "confirmed_cases",
    label: "Confirmed cases",
    group: "cumulative",
    tooltip: "Total confirmed cases to date.",
    payloadKey: "cases.confirmed",
  },
  {
    key: "recoveries",
    label: "Recoveries",
    group: "cumulative",
    tooltip: "Total recoveries to date.",
    payloadKey: "cases.recoveries",
  },
  {
    key: "deaths",
    label: "Deaths",
    group: "cumulative",
    tooltip: "Total deaths to date.",
    payloadKey: "cases.deaths",
  },
  {
    key: "samples_tested_total",
    label: "Samples tested",
    group: "cumulative",
    tooltip: "Total samples tested to date.",
    payloadKey: "labs.testsDone",
  },
  {
    key: "positive_samples",
    label: "Positive samples",
    group: "cumulative",
    tooltip: "Total positive results to date.",
    payloadKey: "labs.positive",
  },
  {
    key: "negative_samples",
    label: "Negative samples",
    group: "cumulative",
    tooltip: "Total negative results to date.",
    payloadKey: "labs.negative",
  },
  {
    key: "travellers_screened_total",
    label: "Travellers screened",
    group: "cumulative",
    tooltip: "Total travellers screened at points of entry to date.",
    payloadKey: "poe.totalScreened",
  },
  {
    key: "screening_points",
    label: "Screening points",
    group: "cumulative",
    tooltip: "Points of entry currently screening.",
    payloadKey: "poe.screeningPoints",
  },
  {
    key: "contacts_listed",
    label: "Contacts listed",
    group: "cumulative",
    tooltip: "Contacts registered for follow-up to date.",
    payloadKey: "cases.contactsListed",
  },
  {
    key: "confirmed_cases_24h",
    label: "New confirmed (24h)",
    group: "last24h",
    tooltip: "Confirmed cases reported in the last 24 hours. Do not sum across dates.",
    payloadKey: "cases.newConfirmed24h",
  },
  {
    key: "samples_tested_24h",
    label: "Samples tested (24h)",
    group: "last24h",
    tooltip: "Samples tested in the last 24 hours.",
    payloadKey: "labs.newTested24h",
  },
  {
    key: "travellers_screened_24h",
    label: "Travellers screened (24h)",
    group: "last24h",
    tooltip: "Travellers screened in the last 24 hours.",
    payloadKey: "poe.newScreened24h",
  },
];

export const MAX_FIGURE = 2147483647;
export const MAX_SOURCE_LENGTH = 200;
export const MAX_NOTES_LENGTH = 1000;

const ROW_FIELD_LABELS = new Map([
  ["situation_date", "Situation date"],
  ["report_date", "Report date"],
  ["source_label", "Source"],
  ["notes", "Notes"],
  ...HEADLINE_FIGURE_FIELDS.map(({ key, label }) => [key, label]),
]);

export function fieldLabel(key) {
  return ROW_FIELD_LABELS.get(key) ?? null;
}

export function parseFigureInput(value) {
  const text = String(value ?? "").replace(/[\s,]/g, "");
  if (text === "") return { ok: true, value: null };
  if (!/^\d+$/.test(text)) return { ok: false };
  const parsed = Number(text);
  return parsed <= MAX_FIGURE ? { ok: true, value: parsed } : { ok: false };
}

export function saveFailure(caught) {
  if (caught?.status === 409 && caught?.message?.includes("changed since")) return { message: "This record changed since you opened it. Your entries are still here. Reload the latest figures before saving.", conflict: true };
  const issue = caught?.body?.errors?.[0];
  const field = issue?.path?.[0];
  const label = fieldLabel(field);
  if (label) {
    const detail = typeof issue.message === "string" && issue.message ? ` ${issue.message}` : "";
    return { message: `Unable to save figures. Check ${label}.${detail}`, field };
  }
  return {
    message: caught instanceof Error ? `Unable to save figures. ${caught.message}` : "Unable to save figures.",
  };
}

export function figuresToPayload(form) {
  const payload = {};
  for (const { key } of HEADLINE_FIGURE_FIELDS) {
    const parsed = parseFigureInput(form?.[key]);
    if (!parsed.ok) return { ok: false, key };
    payload[key] = parsed.value;
  }
  return { ok: true, payload };
}

export function changedFields(row, next) {
  return Object.fromEntries(
    Object.entries(next).filter(([key, value]) => (row?.[key] ?? null) !== value),
  );
}

export function figureDifference(entered, warehouse) {
  if (!Number.isFinite(entered) || !Number.isFinite(warehouse)) return null;
  return entered - warehouse;
}

export function formatSigned(n) {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  return `${n < 0 ? "−" : "+"}${Math.abs(n).toLocaleString("en-KE")}`;
}

export function deriveCfr(deaths, confirmed) {
  if (!Number.isFinite(deaths) || !Number.isFinite(confirmed) || confirmed <= 0) return null;
  return Math.round((deaths / confirmed) * 1000) / 10;
}

const NAIROBI_DATE = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Nairobi",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function nairobiToday(now = new Date()) {
  const parts = Object.fromEntries(NAIROBI_DATE.formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

const SITUATION_DATE_FORMAT = { weekday: "short", day: "numeric", month: "short", year: "numeric" };

export function formatSituationDate(iso) {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString("en-KE", SITUATION_DATE_FORMAT);
}
