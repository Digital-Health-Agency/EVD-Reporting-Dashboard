# Kenya Ebola Surveillance Dashboard

A Next.js application for Kenya's national Ebola virus disease surveillance
response. The dashboard is built for the **Ministry of Health, Kenya**, the
**National Emergency Operations Centre (NEOC)**, and the **Digital Health
Agency (DHA)**.

The project has moved from a single executive dashboard into a three-surface
dashboard app:

- **Public landing** - a safe, public-facing outbreak update page.
- **Executive dashboard** - a linked national situation-report dashboard for
  leadership and response coordination.
- **Operational workspace** - a restricted operational surface. It currently
  uses real Better Auth sign-in and aggregate operations preview; sensitive
  line-level data remains out of the UI.

The app directory is now `dashboard/`.

---

## Product Direction

### 1. Public landing (`/`)

The landing page should follow the pattern used by current public outbreak
microsites such as Uganda's Ebola updates page: clear status, aggregate figures,
public guidance, and obvious ways to report or seek help.

Public content should be aggregate-only and safe to publish:

- Current outbreak status and "as of" timestamp.
- Cumulative confirmed cases, admissions, recoveries, deaths, tests, contacts,
  alerts, and point-of-entry screening totals when available.
- Simple daily case trend.
- Public health messaging: symptoms, prevention, travel guidance, hotline, SMS
  alert, and resources.
- Link to the executive dashboard for authorized/internal stakeholders.

No line lists, personally identifiable information, facility-sensitive records,
or contact-level details should be exposed on the public surface.

### 2. Executive dashboard (`/executive`)

The current dashboard becomes the executive situation-report surface. It should
remain concise and decision-oriented:

- Headline status cards for cases, testing, screening, deaths, recoveries, and
  case fatality rate.
- 24-hour and cumulative views where data exists.
- Points-of-entry screening totals, breakdowns, and map view.
- Laboratory trend and result breakdown.
- Training and readiness indicators.
- Response-pillar sections for clinical management, contacts, community
  surveillance, and laboratory.
- Provenance labels that make live, unavailable, and preview data explicit.

The executive page should compress the response into the facts leadership needs
for daily briefings: what changed, where risk is concentrated, which response
pillars are moving, and which data sources are still pending.

### 3. Operational workspace (`/operational`)

The operational surface is restricted. Users sign in with DHA EVD accounts
before entering the workspace. The authenticated view may show aggregate
operational queues and indicators, but must not display patient, contact,
traveller, or facility-sensitive line lists.

The authenticated preview supports response teams with:

- A Summary tab for aggregate operational queues, priority metrics, data quality
  flags, and EOC actions.
- Dedicated Laboratory, POE, Health facilities, Community, Contacts, and EOC
  actions tabs.
- Tab-specific data filters, including period, geography, facility, point of
  entry, laboratory, result status, alert status, follow-up status, action
  owner, deadline, and priority where relevant.
- Data quality and source-provenance flags.
- Follow-up performance, alert investigation status, and sample turnaround
  status.
- Action tracker for EOC tasks, owners, timelines, and blockers.
- Admin-only Users tab plus `/users` pages for login account, role, status and
  password actions.
- Profile pages for display name, photo and password updates.
- Exportable daily briefing inputs.

Keep the authenticated operational workspace aggregate-only until role rules and
backend data contracts explicitly permit more sensitive operational records.

---

## Source Documents

The folder [`docs/`](docs/) contains the source indicator documents that define
the dashboard scope:

- [`EVD Indicators.pdf`](docs/EVD%20Indicators.pdf)
- [`BVD-Indicators-to-be-Tracked.pdf`](docs/BVD-Indicators-to-be-Tracked.pdf)
- [`EVD Surveillance Dashboards Indicators.pdf`](docs/EVD%20Surveillance%20Dashboards%20Indicators.pdf)

These documents frame the work as a **comprehensive surveillance dashboard**
covering the full response chain: Points of Entry, Health Facilities,
Community, and Laboratories.

`EVD Surveillance Dashboards Indicators.pdf` also records the original delivery
intent:

- Prototype demo: Monday, 15 June 2026.
- Full dashboard demo: Wednesday, 17 June 2026.
- Consolidated EVD surveillance dashboard responsibility: DHA / Apeiro.
- ADaM dashboard revision for defined PoE indicators: Dr. Karimi and George
  Miller.

---

## Indicator Matrix

The docs define four service-point groups.

| Service point | Indicators | Disaggregation | Frequency | Data sources | Filters |
| --- | --- | --- | --- | --- | --- |
| **Points of Entry (POE)** | No. screened; suspected cases / alerts; contacts listed | Point of entry; sex where applicable | Near real-time where available | ADaM, UHAI, Ebola CIF, MOH 502, contacts listing form | Period |
| **Health Facility (HF)** | Suspected cases; new confirmed cases in last 24h; total confirmed cases; currently admitted; deaths in last 24h; total deaths; recoveries in last 24h; total recoveries; case fatality rate; contacts listed; contacts followed up | Sex | Daily or cumulative | TC EMRs, ADaM CIF, EMRs, labs, civil registries (D1), contacts listing form | Period, county |
| **Community** | Signals generated by CHPs; verified signals linked to facilities by CHAs; contacts traced | Sex where applicable | Daily where applicable | eCHIS, M-Dharura, EBS Connect, KRCS app, ADaM | Period, county |
| **Laboratory** | Tests done; positive tests; negative tests; inconclusive tests; pending results; positivity rate; turnaround time | Sample/lab/facility geography where available | Daily or computed | ADaM, lab registers, LIMS, lab systems | Period |

The detailed EVD matrix also identifies useful operational variables:

- Signal number, county, subcounty, ward, and signal raised/verified dates.
- Name of point of entry, screening date, traveller demographics, clinical
  symptoms, country of origin, transit country, and destination.
- Health facility, date seen, patient identifier, age, gender, address, travel
  history, clinical symptoms, symptom onset date, sample dates, lab result, and
  location hierarchy.
- Contact name, date listed, age, gender, address, country, county, ward,
  follow-up status, 21-day completion, and contacts who develop symptoms.
- Laboratory name, lab ID, sample source, sample collection/sending/receiving
  dates, preliminary/final results, result communication date, and turnaround
  time.

Operational variables may be sensitive. They belong behind authentication or in
backend data pipelines, not on the public page.

---

## Current Implementation

The current app already contains the executive dashboard implementation and
backend-owned analytics integration:

- `app/page.js` currently renders `DashboardShell`; this should move to
  `/executive` as the app gains a public landing page.
- `components/DashboardShell.js` owns Ebola refresh/polling, POE map
  switching, and loading/error states.
- `components/Dashboard.js` renders the current executive situation report.
- `components/OperationalWorkspace.js` renders the authenticated operational
  Summary tab, service-point tabs, admin-only Users tab, and tab-specific
  filters.
- `components/PoeBubbleMap.js` renders the points-of-entry map view.
- `components/DashboardShell.js` and `components/PublicLanding.js` fetch
  `/api/analytics/metrics`, which is proxied to the NestJS backend.
- The NestJS backend owns all analytics SQL and reads the restored Postgres
  `gold` schema through `ANALYTICS_DATABASE_URL`.
- `lib/contracts.js` defines the UI-facing dashboard payload shape and empty
  section factories.

## API Proxy Configuration

The dashboard keeps browser requests same-origin by proxying `/api/*` and
`/api/auth/*` through the Next.js server to the NestJS API.

Set `SERVER_URL` to the API base URL reachable from the dashboard server or
container. In production this should normally be an internal service URL such
as `http://server:4000` rather than the public `https://api...` hostname, so the
dashboard does not hairpin through the public reverse proxy.

`NEXT_PUBLIC_SERVER_URL` is still accepted as a legacy fallback for existing
builds, but new deployments should prefer `SERVER_URL`.

Current live data comes from backend analytics endpoints backed by Postgres
`gold` tables where available:

- `gold.report_case_summary`
- `gold.report_case_trend`
- `gold.report_case_distribution`
- `gold.report_laboratory_summary`
- `gold.report_screening_summary`
- `gold.report_geographic_summary`

Sections without a backing gold indicator are surfaced as
preview/awaiting-data sections and should not be filled with fake operational
values.

Some headline values in the current executive UI are interim hardcoded values
while the corresponding marts/contracts are completed. Keep those visible as
interim implementation details and replace them with sourced fields as soon as
the data contract is available.

---

## Architecture Approach

Use a **shared shell plus audience-specific pages**.

Planned route structure:

```text
app/
|-- page.js                  # Public landing
|-- executive/
|   `-- page.js              # Executive situation-report dashboard
|-- operational/
|   `-- page.js              # Auth-gated aggregate operations preview
|-- login/
|   `-- page.js              # Sign in
|-- forgot-password/
|   `-- page.js              # Request reset link
|-- reset-password/
|   `-- page.js              # Complete password reset
|-- profile/
|   |-- page.js              # Current login account
|   |-- edit/
|   |   `-- page.js          # Name and photo update
|   `-- change-password/
|       `-- page.js          # Password update
|-- users/
|   |-- page.js              # Admin user management
|   |-- new/
|   |   `-- page.js          # Create login user
|   `-- [id]/
|       `-- page.js          # Edit login user
|-- api/
|   `-- metrics/
|       |-- route.js
|       `-- [disease]/
|           `-- route.js
`-- layout.js
```

Recommended component direction:

```text
components/
|-- AppHeader.js             # Shared MoH / NEOC / DHA chrome
|-- PublicLanding.js         # Public aggregate update page
|-- ExecutiveDashboard.js    # Wrapper around the current DashboardShell
|-- OperationalWorkspace.js  # Authenticated aggregate operations preview
|-- auth/                    # Auth/profile/admin route gates
|-- users/                   # User management components
|-- Dashboard.js             # Current executive report body
|-- DashboardShell.js        # Current Ebola polling shell
`-- PoeBubbleMap.js
```

Guiding principles:

- Keep public, executive, and operational audiences separate.
- Reuse the data-source seam rather than letting components query the warehouse.
- Show provenance for every metric family.
- Use aggregate-only data on the public page.
- Keep operational data behind authentication once implemented.
- Prefer incremental route/component extraction over a full platform refactor.

---

## International References And Lessons

Recent Ebola dashboards suggest a useful audience split:

- **Uganda public updates**:
  [`evd-daily.health.go.ug`](https://evd-daily.health.go.ug/) is a lightweight
  public microsite with aggregate cases, tests, contacts, alerts, POE screening,
  resources, hotline, and SMS alert actions. The public page should be clear,
  reassuring, and safe.
- **Uganda 2022 ArcGIS dashboard**:
  [ArcGIS Dashboard](https://www.arcgis.com/apps/dashboards/923cc1ef86f84472be87953ae2ebff50)
  shows the KPI/map style used during a previous Ebola response.
- **DRC Ministry public epidemiology route**:
  [`sante.gouv.cd/epidemie/ebola-bundibugyo-2026`](https://sante.gouv.cd/epidemie/ebola-bundibugyo-2026)
  is an official public portal with dynamic surveillance panels, filters, and
  map/card loading states. This is a public-operational hybrid.
- **INRB/UMIE technical map**:
  [`inrb-umie.github.io/BDBV2026-Epidemic_Dashboard`](https://inrb-umie.github.io/BDBV2026-Epidemic_Dashboard/)
  is a GitHub Pages + Leaflet dashboard with embedded geospatial and modeled
  data. This is useful for analytical/geospatial inspiration, not for exposing
  sensitive operational records.
- **DRC EOC dashboards**:
  [PATH's DRC Ebola digitalization write-up](https://www.path.org/our-impact/articles/digitalizing-ebola-response/)
  describes DHIS2-based daily dashboards used in EOCs for epidemic curves,
  cases, contact tracing, treatment, timelines, and wall-monitor/tablet decision
  support.
- **DRC DHIS2 Tracker response**:
  [DHIS2's 2025 DRC Ebola response case study](https://dhis2.org/drc-ebola-response-2025/)
  describes case-based surveillance, suspected case identification, contacts,
  and near real-time visibility of possible transmission chains.
- **Nigeria EOC response**:
  [CDC's 2014 Nigeria outbreak report](https://www.cdc.gov/mmwr/preview/mmwrhtml/mm6339a5.htm)
  describes incident-management response teams for epidemiology/surveillance,
  case management, IPC, labs, POE, social mobilization, and coordination.

The lesson for this app: public dashboards communicate confidence, executive
dashboards support decisions, and operational dashboards drive daily response
work.

---

## Tech Stack

- [Next.js](https://nextjs.org/) App Router
- React
- [Recharts](https://recharts.org/) for charts
- Plain CSS, no UI framework

Requirements: Node.js 18.18+; Node 20+ recommended.

---

## Getting Started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

Other scripts:

```bash
npm run build
npm run start
npm run lint
```

Note: `npm run lint` depends on the Next.js lint command being available in the
installed Next.js version. If this script fails because the command has been
removed or changed, replace it with the current project lint command.

---

## Data Layer

The UI reads analytics through the backend API, not directly from the
warehouse. Dashboard-local routes must not open database connections.

```js
fetch("/api/analytics/metrics", { cache: "no-store" });
```

The analytics API must preserve these behaviors:

- Return a stable shape even when a mart is unavailable.
- Mark unavailable sections as `pending` or `na` through provenance.
- Keep SQL isolated in `server/src/modules/analytics`.
- Query only the restored analytics `gold` schema for dashboard metrics.

---

## Data Safety

Public page:

- Aggregate-only.
- No PII.
- No contact line-list detail.
- No facility-sensitive operational records unless explicitly cleared.

Executive page:

- National and county/POE aggregate views.
- Provenance visible.
- Preview sections clearly marked.

Operational page:

- Real login and session management now.
- Users tab and `/users` pages are admin-only.
- Sensitive data only after authentication and role rules explicitly permit it.

---

## License

(c) Ministry of Health, Kenya - Digital Health Agency. All rights reserved.
