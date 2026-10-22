# Uncommitted changes across the EVD repos — 22 Oct 2026

Purpose: tell the other teams (especially those working on contacts and
NPHIIS) exactly which files this work touched, so branches can be merged
without surprises. Nothing below has been committed or pushed yet.

**EVD-Surveillance-scripts-v1 was not changed.** It was only pulled to
`main`; the gitignored `.dlt/secrets.toml` holds local MinIO credentials.

## 1. EVD-Reporting-Dashboard (branch `main`)

Public landing page: one card per headline figure, each with a 14-day daily
chart.

| File | Change |
|---|---|
| `components/PublicLanding.js` | Five cards, in the order requested: Cases → People Tested → Deaths → Contacts Listed → Screening (full width). The Cases card shows confirmed cases only; Recoveries is no longer shown. "Samples Tested" became "People Tested": distinct people tested (`labs.patientsTested`) with a 24h change, plus "Positive" counting people with a positive test (`labs.patientsPositive`). Negative was removed. Deaths has its own card, with the case fatality rate. "Contacts listed" moved out of the Screening card into the Contacts Listed card. Every card ends with a daily chart of the last 14 days (`DailyTrend` with `dailyTrendPoints`), which replaces the old `ScreeningTrend`. New icons: `deaths` (coffin outline) and `contacts`. |
| `app/globals.css` | Icon and banner colours for `deaths` and `contacts` (DHA blue). Trend bar colours moved to CSS variables (`--trend-bar*`) with per-card modifiers `.metric-trend--{deaths,cases,tests,contacts}`; screening keeps the green default. New `.metric-trend__tick-date`, `.metric-trend__range` and `.metric-trend__empty`. Charts are pinned to the bottom of each card so neighbouring charts line up. |
| `lib/indicator-tooltips.js` | New `positivePeople` tooltip. |
| `tests/public-landing-static.test.mjs` | Contacts assertion updated for the new banner; new tests for card order, the daily trends and the empty state. |
| `docs/change-log-2026-10-22.md` | This file. |

Chart behaviour:
- Shows the last 14 calendar days ending today (Nairobi time). Days with no
  records are zero.
- Ticks show the weekday with the day number underneath. The caption shows
  the date range; the tooltip shows the full date.
- If a series has nothing in the window, the card says "No new … in the last
  14 days" instead of drawing empty bars.
- The screening chart uses the same component and window. It is fed from
  `poe.trend`, which still includes official 24h screening figures from
  reconciliation.

Data notes:
- The headline numbers can come from reconciled official figures, while the
  charts always use warehouse data.
- The cases chart counts all investigations reported (mostly suspected). The
  tooltip also shows confirmed cases.

Tests: run `node --test tests/*.test.mjs` (180 pass). `npm test` uses a glob
that needs Node 21 or later.

## 2. EVD-Dashboard-Backend (branch `main`)

| File | Change |
|---|---|
| `src/modules/analytics/analytics.service.ts` | **Additive only; no existing field or query changed.** `caseSummary()` adds `newContacts24h`, using the same rolling 24-hour rule as the other deltas. `labSummary()` adds `patientsPositive` (distinct people with a positive EVD test) and `newPatientsTested24h`. New `dailyTrend()` runs one query returning 14 calendar days (`generate_series`, ending at `nairobiToday()`) with cases, confirmed, deaths, recoveries, tests, positives, people tested, people positive and contacts per day. It is served as `cases.daily` and `labs.daily`. New constant `LAB_EVENT_AT`. |
| `src/modules/analytics/analytics.service.spec.ts` | Mock handles the daily query; the lab-filter check now compares only the first two parameters (EVD code and start date), because the daily query adds today's date as a third. Assertions for the new fields. |
| `docs/gold-schema.md` | Documents `newContacts24h`, `patientsPositive`, `newPatientsTested24h`, `cases.daily` and `labs.daily`. |
| `src/modules/operational/column-registry.ts`, `column-labels.ts` | Cases linelist gains the warehouse's `case_record_origin` ("Record origin": `INVESTIGATION` or `LAB_ONLY`) and `duplicate_lab_case_flag` ("Duplicate lab case") columns, shown by default to signed-in users. |
| `src/modules/operational/operational.service.ts`, `indicator-catalog.ts` | Text only: the Summary "Confirmed cases" card detail and catalog definition now describe lab-anchored confirmation. The count logic is unchanged and still `sum(final_confirmed_count)`. |
| `src/modules/operational/operational.service.ts` | Summary tab: the "Current admitted" card and the "Current admitted" column of the "Cases by health facility" table are removed (no gold mart records admissions; it was a fixed zero). The Health facilities tab is unchanged. The dashboard's `card-linelist-map.js` still has an unused `summary.currentAdmitted` entry, left in place. |
| `src/modules/operational/column-registry.ts`, `column-labels.ts` | Lab linelists (Tests completed, Positive, Negative) and their CSV exports show **Requesting facility** (`reporting_requesting_facility_name`, searchable) by default instead of the MFL code. "Requesting facility MFL" is still available under Columns. This was the only place the MFL code was shown. |
| `src/modules/operational/column-registry.spec.ts`, `operational.service.spec.ts` | Label count 77 → 80; Summary tests updated for four cards and a five-column facility table. |
| `src/modules/analytics/analytics.service.ts` (24h rule) | Public "Last 24h" figures (cases, confirmed, deaths, recoveries, contacts, tests, people tested, screening, alerts) count back 24 hours **from now**, passed in as a parameter, instead of from each source's newest record. A quiet source now shows +0 instead of its last busy day. The operational period filters follow the same rule (next row). |
| `src/modules/analytics/analytics.service.ts` (screening) | Public screening figures (`poe` summary, trend, by-POE) count point-of-entry traveller screenings only (`surveillance_pathway = 'TRAVELLER'`). They previously also included 202 Taifa Care facility screenings. Total screened: 412,639 → 412,437, matching the operational POE tab. |
| `src/modules/operational/operational.service.ts`, `linelist.service.ts`, `linelist-export.service.ts`, `src/common/analytics-helpers.ts` | **Operational period filters count back from today.** "Last 24 hours / 7 / 21 / 42 days" on every tab, linelist and CSV export now end **now**, not at each source's newest record. The existing `bounds` CTEs keep their `max_event_at` name, but it is now `now()` (constant `PERIOD_ANCHOR`), so query parameters and SQL shapes are unchanged. Tabs report the preset window as today back the period in Nairobi dates (`servedWindow` / `presetWindowDates`). A tab with no data in the window reports no window, so its empty state still shows. Preset exports no longer look up the newest record to date the file. "All time" and custom ranges are unchanged. Verified on all 6 tabs: windows end 22 Oct; "Last 24 hours" is 0 everywhere (no data loaded since 21 Oct); linelist totals equal the tab cards; 7-day figures match direct database counts. |
| `operational.service.spec.ts`, `linelist.service.spec.ts`, `linelist-export.service.spec.ts` | 14 tests that pinned newest-record anchoring (`not.toContain('now()')`, data-span windows for presets, the export's bounds lookup) now assert the new rule. The data-span window check moved to "All time", and a test was added for preset windows. |
| `src/database/database.module.ts` | Analytics connection only: session time zone `Africa/Nairobi`, and `DATE` columns returned as `YYYY-MM-DD` text. This fixes linelist and CSV dates showing one day early when the API runs east of UTC, and makes custom date filters mean Kenyan days even on a UTC database server. The auth database is unchanged. Tests added in `database.module.spec.ts`. |
| `src/scripts/seed-admin.ts` | Bug fix: the hidden password prompt hung when a password was pasted, because it treated the whole pasted chunk as one keystroke. It now handles each character. |

⚠️ **For the contacts teams:**
- If you change `gold.report_contact_registration`, keep
  `registration_date`/`registration_datetime` and
  `total_contact_registration_count`, or update `dailyTrend()` and the
  `contacts_24h` subquery in `caseSummary()` to match.
- If contact follow-up data arrives, `contactsFollowedUp` is still `null`;
  the Contacts card has room for a follow-up figure.

Tests: `npx vitest run` passes (1,146). `npx tsc --noEmit` reports 21 type
errors in the spec mocks; those were already there before this change. The
`nest build` compiles cleanly.

### Confirmed cases: decided in the warehouse, not the backend

The ETL branch `feat/nphiis` (Koske Danson, 22 Oct) makes confirmation
lab-anchored. A case is confirmed only when it links to a POSITIVE LIMS EVD
result; each LIMS case counts once; and positive LIMS cases with no form are
added as `LAB_ONLY` rows. The backend therefore reads
`sum(final_confirmed_count)` exactly as before, and public, operational and
reconciliation figures all agree: 9 confirmed locally (8 lab-only + 1
NPHIIS), from 10 positive tests.

A first attempt computed the deduplication in the backend instead (including
a lab-level "Repeat positive" linelist column). It was withdrawn so there is
one definition. It is kept in `git stash` in EVD-Dashboard-Backend
("lab-level confirmed dedup in backend (superseded by ETL feat/nphiis)") if a
lab-test-level repeat flag is wanted later. The better home for that flag
would be a column on `gold.report_lab_result`.

## 3. EVD-Warehouse-ETL (local checkout on `feat/nphiis`, pulled to `fa2e17e`)

| File | Change |
|---|---|
| `transform/evd_transform/models/silver/slv_mdharura.sql` | Bug fix: the m-Dharura extractor renamed `community_unit` to `unit_name`/`unit_type` (scripts commit `eaa08ce`, 8 Jul). The model now selects `community_unit` only if the bronze column exists, and otherwise outputs `null::text`. Production, whose bronze table still has the old column, is unaffected; fresh environments no longer fail. |
| *(local database only)* | The new `slv_nphiis_cases` / `slv_nphiis_contacts` models select columns that bronze only creates once a field has had a value (e.g. `preliminary_result`; on contacts `epid`, `county`, `facility`). The local NPHIIS sample has none, so those columns were added locally as empty `text` columns, the same thing bronze ingestion does when a field first appears. No data changed. **For the ETL team:** like the m-Dharura fix above, these models break on any bronze table that has never seen a value for a column. A small macro that selects a column only if it exists (else `null`) would make them safe. |
| `pyproject.toml` | Adds `dbt-core<1.12` to `constraint-dependencies`. dbt-core 1.12 depends on an alpha Rust parser that downloads at install time and hangs; the team runs 1.11. `uv.lock` is gitignored, so without this pin every fresh install resolves 1.12. |

## Local environment used for testing (not in any repo)

- Postgres (Homebrew, :5432): `evd` (backend auth) and `evd_dwh` (warehouse).
- MinIO in Docker: container `evd-minio`, API on :9000, console on :9001,
  bucket `evd`, on the `evd-net` network. Uses the `chainguard/minio` image,
  because MinIO no longer publishes free images.
- Backend on :4000, dashboard on :3003. Ports 3000–3002 are used by other
  local projects.
- Data loaded from: ADaM (uploaded raw files), LIMS, UHAI, Taifa Care, CBS,
  KRCS screening/quarantine, m-Dharura and NPHIIS. eCHIS was not loaded: its
  endpoint returns 404.
