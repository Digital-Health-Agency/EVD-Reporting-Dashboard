// Data-source abstraction.
//
// One swappable seam between the UI and the warehouse. Today there is a single
// "live" adapter (ClickHouse Gold marts). The DATA_SOURCE env var selects the
// adapter so others can be slotted in later without touching the UI or routes.
// In v2 a Spring Boot service replaces everything behind getDashboardData().

import { diseaseByKey, DEFAULT_DISEASE } from "@/lib/diseases";
import {
  provenance,
  emptyLabSection,
  emptyCaseSection,
  emptyPoeSection,
} from "@/lib/contracts";
import * as live from "@/lib/datasource/live";
import * as mock from "@/lib/datasource/mock";

function adapter() {
  switch ((process.env.DATA_SOURCE || "mock").toLowerCase()) {
    case "live":
      return live;
    case "mock":
    default:
      return mock;
  }
}

// Run a section query, degrading to an empty shape (never throwing) so one
// unavailable mart can't blank the whole dashboard.
async function safe(fn, fallback, okLabel, disease) {
  try {
    const data = await fn();
    const available = data.available !== false;
    const adapterName = adapter().name === "mock" ? "mock" : "live";
    return {
      data,
      prov: available
        ? provenance(adapterName, adapterName === "mock" ? okLabel.replace("Source:", "Mock:") : okLabel)
        : provenance("na", `No ${disease} data in this mart`),
    };
  } catch (err) {
    console.error("[datasource] query failed:", err?.message || err);
    return { data: fallback(), prov: provenance("pending", "Awaiting data source (query failed)", true) };
  }
}

/**
 * Compose the full dashboard payload for one disease.
 * @param {string} diseaseKey  registry key (e.g. "ebola"); falls back to default.
 * @returns {Promise<import("@/lib/contracts").DashboardData>}
 */
export async function getDashboardData(diseaseKey = DEFAULT_DISEASE) {
  const a = adapter();
  const disease = diseaseByKey(diseaseKey) || diseaseByKey(DEFAULT_DISEASE);

  const [labs, cases, poe, readiness] = await Promise.all([
    safe(() => a.lab(disease.name), emptyLabSection, "Source: marts.lab_by_disease / lab_daily", disease.name),
    safe(() => a.cases(disease.name), emptyCaseSection, "Source: marts.cases_by_disease", disease.name),
    safe(() => a.poe(), emptyPoeSection, "Source: stg_adam.screenings (interim)", disease.name),
    a.readiness ? safe(() => a.readiness(), () => ({ available: false, metrics: [] }), "Source: readiness mock", disease.name) : Promise.resolve({
      data: { available: false, metrics: [] },
      prov: provenance("pending", "Preview - awaiting readiness data source"),
    }),
  ]);

  // Sections with no backing mart yet - surfaced as preview, never faked.
  const AWAITING = provenance("pending", "Preview - awaiting data source");

  return {
    meta: {
      country: "Kenya",
      disease: disease.name,
      lastUpdated: new Date().toISOString(),
      adapter: a.name,
      provenance: {
        labs: labs.prov,
        cases: cases.prov,
        poe: poe.prov,
        readiness: readiness.prov,
        clinical: AWAITING,
        community: AWAITING,
        geographic: AWAITING,
      },
    },
    labs: labs.data,
    cases: cases.data,
    poe: poe.data,
    readiness: readiness.data,
  };
}

/** Overview metric: total tests per disease across all diseases. */
export async function getTestsByDisease() {
  try {
    return await adapter().testsByDisease();
  } catch (err) {
    console.error("[datasource] testsByDisease failed:", err?.message || err);
    return [];
  }
}
