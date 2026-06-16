// Data layer for the EVD Reporting Dashboard.
// All metric values are zeroed placeholders — only structural labels
// (entry points, counties, dates) are present so charts render with axes.
// Replace getDashboardData() with a call to your live source
// (REST API / DHIS2 / scheduled export) returning this shape.

const zero = { total: 0, male: 0, female: 0 };

// Last N calendar days as YYYY-MM-DD, oldest first.
function lastDays(n) {
  const out = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const days = lastDays(7);

// Points of entry (border posts) — labels only, zero values.
const ENTRY_POINTS = ["JKIA T1A", "JKIA T1C", "Busia", "Malaba", "Namanga", "Isebania", "Moyale"];

// Counties — labels only, zero values.
const COUNTIES = ["Busia", "Bungoma", "Kakamega", "Trans Nzoia", "Nairobi", "Kiambu", "Mombasa"];

export const dashboardData = {
  meta: {
    country: "Kenya",
    lastUpdated: new Date().toISOString(),
    reportingPeriod: "",
    daysSinceLastCase: 0,
  },
  summary: {
    suspectedCases: { ...zero },
    confirmedCasesTotal: { ...zero },
    newConfirmed24h: { ...zero },
    currentlyAdmitted: { ...zero },
    totalDeaths: { ...zero },
    newDeaths24h: { ...zero },
    totalRecoveries: { ...zero },
    newRecoveries24h: { ...zero },
    caseFatalityRate: 0,
    activeCases: 0,
  },
  pointsOfEntry: {
    screened: 0,
    suspectedCases: 0,
    contactsListed: { ...zero },
    byEntryPoint: ENTRY_POINTS.map((name) => ({ name, screened: 0, suspected: 0 })),
  },
  healthFacilities: {
    suspectedCases: { ...zero },
    newConfirmed24h: { ...zero },
    totalConfirmed: { ...zero },
    currentlyAdmitted: { ...zero },
    newDeaths24h: { ...zero },
    totalDeaths: { ...zero },
    newRecoveries24h: { ...zero },
    totalRecoveries: { ...zero },
    caseFatalityRate: 0,
    contactsListed: { ...zero },
    contactsFollowedUp: { ...zero },
  },
  community: {
    signalsGenerated: 0,
    verifiedSignalsLinked: { ...zero },
    contactsTraced: { ...zero },
    trend: days.map((date) => ({ date, signals: 0, verified: 0 })),
  },
  labs: {
    testsDone: 0,
    positiveTests: 0,
    negativeTests: 0,
    turnaroundTimeHrs: 0,
    trend: days.map((date) => ({ date, testsDone: 0, positive: 0, negative: 0 })),
  },
  trend: days.map((date) => ({ date, suspected: 0, confirmed: 0, deaths: 0, recoveries: 0 })),
  counties: COUNTIES.map((county) => ({
    county, suspected: 0, confirmed: 0, deaths: 0, recoveries: 0, admitted: 0,
  })),
};

// Single entry point — replace the body with a fetch when the backend exists.
export async function getDashboardData() {
  return dashboardData;
}
