// Data contract for the surveillance dashboard.
//
// This is the single shape the backend analytics API returns and the UI
// consumes. SQL lives in the NestJS server, which maps restored Postgres `gold`
// tables into these structures.
//
// JavaScript project, so contracts are JSDoc typedefs (compile-time only). Each
// section also has a factory returning an empty, correctly-shaped value so the
// adapter never hand-builds skeletons and the UI never crashes on missing data.

// Live metrics from backend Postgres gold analytics.

/**
 * Lab summary for EVD - from gold.report_laboratory_summary.
 * @typedef {Object} LabSection
 * @property {boolean} available           false when the disease has no lab row.
 * @property {number} testsDone            tests_done
 * @property {number} positive
 * @property {number} negative
 * @property {number} inconclusive
 * @property {number} [pendingResults]
 * @property {number} positivityPct        positivity_pct (0..100)
 * @property {number} patientsTested       patients_tested  (shown as "Total screened")
 * @property {number|null} avgTatDays      avg_tat_days (null = not available)
 * @property {string|null} firstTest       YYYY-MM-DD
 * @property {string|null} lastTest        YYYY-MM-DD
 * @property {number} [newTested24h]
 * @property {LabDailyPoint[]} trend       reporting-period trend from gold.report_laboratory_summary
 */

/**
 * One reporting period of lab activity.
 * @typedef {Object} LabDailyPoint
 * @property {string} date      YYYY-MM-DD
 * @property {number} tests
 * @property {number} positive
 * @property {number} negative
 */

/**
 * Case surveillance for EVD - from gold.report_case_summary and gold.report_case_trend.
 * @typedef {Object} CaseSection
 * @property {boolean} available           false when the Ebola case mart has no row.
 * @property {number} totalCases           total_cases
 * @property {number} suspected
 * @property {number} confirmed
 * @property {number} probable
 * @property {number} deaths
 * @property {number} [recoveries]
 * @property {number} [admitted]
 * @property {number} [newCases24h]
 * @property {number} [newConfirmed24h]
 * @property {number} [newAdmissions24h]
 * @property {number} [newRecoveries24h]
 * @property {number} [newDeaths24h]
 * @property {number} [contactsListed]
 * @property {number} [contactsFollowedUp]
 * @property {number} [importedCases]
 * @property {number} [localCases]
 * @property {number} withSpecimenId       with_specimen_id
 */

/**
 * Point-of-entry screenings (all-hazards traveller screening, not disease-specific).
 * From gold.report_screening_summary.
 * @typedef {Object} PoeSection
 * @property {boolean} available
 * @property {number} totalScreened
 * @property {number} uniqueTravelers
 * @property {number} [alerts]
 * @property {number} [newScreened24h]
 * @property {number} [newAlerts24h]
 * @property {Array<{name:string, screened:number, uniqueTravelers:number, alerts?:number, unknown:boolean}>} byPoe
 * @property {string} [note]
 */

// Composed dashboard payload

/**
 * Per-section provenance so the UI marks what is live vs awaiting a data source.
 * @typedef {Object} Provenance
 * @property {"live"|"mock"|"pending"|"na"} source  live = real; mock = development; pending = awaiting mart; na = not applicable.
 * @property {string} label   Human-readable description.
 * @property {boolean} [degraded]  true when a live query failed and returned zeros.
 */

/**
 * Full payload consumed by <Dashboard> for one disease.
 * @typedef {Object} DashboardData
 * @property {Object} meta
 * @property {string} meta.country
 * @property {string} meta.disease
 * @property {string} meta.lastUpdated     ISO timestamp.
 * @property {"live"} meta.adapter
 * @property {Object.<string,Provenance>} meta.provenance  keyed by section.
 * @property {LabSection} labs
 * @property {CaseSection} cases
 * @property {PoeSection} poe
 * @property {{available:boolean, metrics:Array<{label:string,value:number}>}} [readiness]
 */

/** Empty, correctly-shaped lab section. */
export function emptyLabSection() {
  return {
    available: false,
    testsDone: 0,
    positive: 0,
    negative: 0,
    inconclusive: 0,
    pendingResults: 0,
    positivityPct: 0,
    patientsTested: 0,
    avgTatDays: null,
    firstTest: null,
    lastTest: null,
    newTested24h: 0,
    trend: [],
  };
}

/** Empty, correctly-shaped case section. */
export function emptyCaseSection() {
  return {
    available: false,
    totalCases: 0,
    suspected: 0,
    confirmed: 0,
    probable: 0,
    deaths: 0,
    recoveries: 0,
    admitted: 0,
    newCases24h: 0,
    newConfirmed24h: 0,
    newRecoveries24h: 0,
    newDeaths24h: 0,
    contactsListed: 0,
    contactsFollowedUp: 0,
    withSpecimenId: 0,
  };
}

/** Empty, correctly-shaped POE section. */
export function emptyPoeSection() {
  return {
    available: false,
    totalScreened: 0,
    uniqueTravelers: 0,
    alerts: 0,
    newScreened24h: 0,
    newAlerts24h: 0,
    byPoe: [],
  };
}

/** Provenance helper. */
export function provenance(source, label, degraded = false) {
  return { source, label, degraded };
}
