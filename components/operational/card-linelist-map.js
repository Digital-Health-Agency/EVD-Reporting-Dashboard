export const CARD_LINELIST_MAP = Object.freeze({
  "labs.testsDone": {
    dataset: "labResults",
    predicate: {},
    listLabel: "Tests completed",
    noun: "lab results",
  },
  "labs.positiveTests": {
    dataset: "labResults",
    predicate: { resultStatus: "POSITIVE" },
    listLabel: "Positive tests",
    noun: "lab results",
  },
  "labs.negativeTests": {
    dataset: "labResults",
    predicate: { resultStatus: "NEGATIVE" },
    listLabel: "Negative tests",
    noun: "lab results",
  },
  "poe.travellersScreened": {
    dataset: "screenings",
    predicate: {},
    listLabel: "Traveller screenings",
    noun: "screenings",
  },
  "hf.alerts": {
    dataset: "screenings",
    predicate: { screeningScope: "facility", screeningFlagged: "true" },
    listLabel: "Facility screening alerts",
    noun: "screenings",
  },
  "contacts.contactsListed": {
    dataset: "contacts",
    predicate: {},
    listLabel: "Listed contacts",
    noun: "contacts",
  },
  "community.signalsReported": {
    dataset: "signals",
    predicate: {},
    listLabel: "Reported community signals",
    noun: "community signals",
  },
  "community.signalsVerified": {
    dataset: "signals",
    predicate: { signalVerified: "true" },
    listLabel: "Verified community signals",
    noun: "community signals",
  },
  "summary.alerts": {
    dataset: "cases",
    predicate: { initialClassification: "SUSPECTED,PROBABLE" },
    listLabel: "Alerts",
    noun: "cases",
  },
  "summary.confirmedCases": {
    dataset: "cases",
    predicate: { classification: "CONFIRMED" },
    listLabel: "Confirmed cases",
    noun: "cases",
  },
  "summary.deaths": {
    dataset: "outcomes",
    predicate: { treatmentOutcome: "DECEASED" },
    listLabel: "Deceased patients",
    noun: "treatment outcomes",
  },
  "summary.recovered": {
    dataset: "outcomes",
    predicate: { treatmentOutcome: "RECOVERED" },
    listLabel: "Recovered patients",
    noun: "treatment outcomes",
  },
});

export const DATASET_PATHS = Object.freeze({
  labResults: "lab-results",
  screenings: "screenings",
  cases: "cases",
  outcomes: "outcomes",
  contacts: "contacts",
  signals: "signals",
});

function sameProjection(fields, defaults) {
  if (!Array.isArray(fields) || !Array.isArray(defaults)) return false;
  if (fields.length !== defaults.length) return false;
  return fields.every((field, index) => field === defaults[index]);
}

export function buildLinelistParams(entry, tabParams, state) {
  const next = {
    ...(tabParams || {}),
    ...(entry?.predicate || {}),
    page: Number(state?.page) || 1,
  };

  const q = typeof state?.q === "string" ? state.q.trim() : "";
  if (q) next.q = q;

  if (state?.sortBy) {
    next.sortBy = state.sortBy;
    next.sortDir = state.sortDir || "desc";
  }

  if (
    Array.isArray(state?.fields)
    && state.fields.length > 0
    && !sameProjection(state.fields, state.defaults)
  ) {
    next.fields = state.fields.join(",");
  }

  return next;
}

export function rowLinelistEntry(panel, row) {
  const ref = panel?.linelist;
  if (!ref || !DATASET_PATHS[ref.dataset]) return null;

  const value = row?.filterValue;
  if (typeof value !== "string" || value.trim() === "") return null;

  return {
    dataset: ref.dataset,
    predicate: { [ref.filterKey]: value },
    listLabel: `${ref.listLabel} — ${value}`,
    noun: ref.noun,
  };
}

export function linelistFor(tabKey, card) {
  if (!card || card.value === null || card.value === undefined) return null;
  if (card.provenance?.source === "pending") return null;

  if (card.meta?.dataQualityStatus === "unavailable") return null;

  return CARD_LINELIST_MAP[`${tabKey}.${card.key}`] || null;
}
