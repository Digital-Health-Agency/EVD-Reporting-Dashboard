// Live adapter - the ONLY place SQL lives.
//
// Reads the Gold marts (the stable pipeline/UI contract). Disease names are
// already normalised in the marts, so we filter by canonical name directly.
//
//   marts.lab_by_disease    -> lab summary per disease
//   marts.lab_daily         -> lab trend per disease per day
//   marts.cases_by_disease  -> ADaM case surveillance per disease
//   stg_adam.screenings     -> POE traveller screenings (TEMPORARY: the
//                              marts.screenings_by_poe mart doesn't exist yet;
//                              point_of_entry is currently unpopulated, so this
//                              surfaces a real total with an "Unknown" bucket).
//
// Anything not backed by these tables (admissions, recoveries, contacts,
// community signals, geographic spread) is NOT produced here - the composition
// layer marks those sections "awaiting data source".

import { query } from "@/lib/datasource/clickhouse";
import { DISEASES } from "@/lib/diseases";
import { emptyLabSection, emptyCaseSection, emptyPoeSection } from "@/lib/contracts";

export const name = "live";

const num = (v) => (v == null ? 0 : Number(v));
const dateOrNull = (v) => (v ? String(v) : null);

/** Lab summary + daily trend for one disease. */
export async function lab(diseaseName) {
  const [summaryRows, dailyRows] = await Promise.all([
    query(
      `SELECT disease, tests_done, positive, negative, inconclusive,
              positivity_pct, patients_tested, avg_tat_days, first_test, last_test
       FROM marts.lab_by_disease
       WHERE disease = {disease:String}
       LIMIT 1`,
      { disease: diseaseName }
    ),
    query(
      `SELECT toString(test_date) AS date, tests, positive, negative
       FROM marts.lab_daily
       WHERE disease = {disease:String}
       ORDER BY test_date`,
      { disease: diseaseName }
    ),
  ]);

  const section = emptyLabSection();
  section.trend = dailyRows.map((r) => ({
    date: r.date,
    tests: num(r.tests),
    positive: num(r.positive),
    negative: num(r.negative),
  }));

  const r = summaryRows[0];
  if (!r) return section; // available stays false
  section.available = true;
  section.testsDone = num(r.tests_done);
  section.positive = num(r.positive);
  section.negative = num(r.negative);
  section.inconclusive = num(r.inconclusive);
  section.positivityPct = num(r.positivity_pct);
  section.patientsTested = num(r.patients_tested);
  section.avgTatDays = r.avg_tat_days == null ? null : Number(r.avg_tat_days);
  section.firstTest = dateOrNull(r.first_test);
  section.lastTest = dateOrNull(r.last_test);
  return section;
}

/** Case surveillance for Ebola (empty/unavailable when the mart has no row). */
export async function cases(diseaseName) {
  const rows = await query(
    `SELECT disease, total_cases, suspected, confirmed, probable, deaths, with_specimen_id
     FROM marts.cases_by_disease
     WHERE disease = {disease:String}
     LIMIT 1`,
    { disease: diseaseName }
  );
  const section = emptyCaseSection();
  const r = rows[0];
  if (!r) return section;
  section.available = true;
  section.totalCases = num(r.total_cases);
  section.suspected = num(r.suspected);
  section.confirmed = num(r.confirmed);
  section.probable = num(r.probable);
  section.deaths = num(r.deaths);
  section.withSpecimenId = num(r.with_specimen_id);
  return section;
}

const isUnknownPoe = (name) => name === "" || /unknown|not recorded/i.test(name);

/**
 * Point-of-entry traveller screenings (all-hazards, not disease-specific).
 *
 * Preferred source is the gold mart marts.screenings_by_poe (JKIA, Busia, and others).
 * Until that mart is published in this environment we fall back to the interim
 * stg_adam.screenings total (point_of_entry isn't recorded there, so it surfaces
 * a single "Not recorded" bucket with a note) - never fabricated POE names.
 */
export async function poe() {
  try {
    const rows = await query(
      `SELECT point_of_entry AS name, screened, unique_travelers
       FROM marts.screenings_by_poe
       ORDER BY screened DESC`
    );
    if (rows.length) {
      const section = emptyPoeSection();
      section.available = true;
      section.byPoe = rows.map((r) => {
        const name = r.name || "Unknown";
        return {
          name: isUnknownPoe(r.name) ? "Unknown" : name,
          screened: num(r.screened),
          uniqueTravelers: num(r.unique_travelers),
          unknown: isUnknownPoe(r.name),
        };
      });
      section.totalScreened = section.byPoe.reduce((a, b) => a + b.screened, 0);
      section.uniqueTravelers = section.byPoe.reduce((a, b) => a + b.uniqueTravelers, 0);
      return section;
    }
  } catch {
    // mart not published in this environment yet - fall through to interim total
  }

  // Interim fallback: stg_adam.screenings (POE not recorded there -> total only).
  const rows = await query(
    `SELECT if(point_of_entry = '', 'Not recorded', point_of_entry) AS name,
            count()             AS screened,
            uniqExact(ident)    AS unique_travelers
     FROM stg_adam.screenings
     GROUP BY name
     ORDER BY screened DESC`
  );
  const section = emptyPoeSection();
  section.available = rows.length > 0;
  section.byPoe = rows.map((r) => ({
    name: r.name,
    screened: num(r.screened),
    uniqueTravelers: num(r.unique_travelers),
    unknown: r.name === "Not recorded",
  }));
  section.totalScreened = section.byPoe.reduce((a, b) => a + b.screened, 0);
  section.uniqueTravelers = section.byPoe.reduce((a, b) => a + b.uniqueTravelers, 0);
  const allUnknown = section.byPoe.length > 0 && section.byPoe.every((p) => p.unknown);
  if (allUnknown) {
    section.note = "Point-of-entry breakdown isn't published in this environment yet - showing the screening total. The chart fills in once marts.screenings_by_poe is available.";
  }
  return section;
}

/** Cross-disease overview: tests done per tracked disease (for tab badges). */
export async function testsByDisease() {
  const rows = await query(`SELECT disease, tests_done FROM marts.lab_by_disease`);
  const byName = new Map(rows.map((r) => [r.disease, num(r.tests_done)]));
  return DISEASES.map((d) => ({ disease: d.name, total: byName.get(d.name) || 0 }));
}
