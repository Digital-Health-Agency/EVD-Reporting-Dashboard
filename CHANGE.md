# Changelog


## 0.2.0 (2026-07-09)
- Add Docker packaging, GHCR image CI on version tags, and git-flow release tooling with standalone Next output.


## 1.0.0 (2026-07-09)
- Major release: dashboard auth flows, account management, login UI improvements, and configurable API URL via environment.


## 1.0.1 (2026-07-09)
- Fix production Docker builds by baking NEXT_PUBLIC_SERVER_URL in at build time via CI secret and Dockerfile build arg.


## 2.0.0 (2026-07-09)
- Major release: add EVD dataset and indicators reference documentation for data alignment.


## 2.0.1 (2026-07-09)
- Fix Docker build reliability by syncing package-lock.json with package.json version.


## 2.0.2 (2026-07-09)
- Fix production API proxying by preferring server-only SERVER_URL over public NEXT_PUBLIC_SERVER_URL, avoiding reverse-proxy hairpinning.


## 2.1.0 (2026-07-09)
- Tresting


## 2.2.0 (2026-07-10)
- Fetch executive and public dashboard metrics from the backend /api/analytics/metrics endpoint, removing the local ClickHouse and mock datasource layer.


## 2.3.0 (2026-07-10)
- Add indicator tooltips across executive, operational, and public views, and align headline metrics with gold-backed analytics fields.


## 2.4.0 (2026-07-10)
- Coordinated minor release for production deployment.


## 3.0.0 (2026-07-10)
- Public and executive dashboards use flagged/alerts terminology, executive testing trend adds positivity rate, and alerts card styling updates.


## 3.0.1 (2026-07-10)
- Centralize deaths card color token for public and executive metric styling consistency.


## 4.0.0 (2026-07-10)
- Streamline the public dashboard around confirmed cases, total screened, recoveries, and deaths; remove legacy tabs and show laboratory testing figures directly.


## 4.1.0 (2026-07-10)
- Require sign-in for the executive dashboard, matching the operational workspace session gate.


## 4.1.1 (2026-07-10)
- Show a zero placeholder for public Deaths while the deaths data pipeline is cleaned up.


## 4.2.0 (2026-07-10)
- Show last-updated as 23:59 on the previous day and refresh the primary brand colour to #35459c.


## 4.3.0 (2026-07-22)
- Align dashboard indicators with current gold reporting schema, refresh tooltips and contact metrics, remove deprecated jsconfig baseUrl, and add NDL warehouse mapping reference.


## 4.4.0 (2026-08-05)
- Refresh public and operational UI: full-bleed heroes, remove executive surface, add public health event selector, multi-disease branding, and re-enable production deploy webhook.

## 4.9.0 (2026-10-07)
- Compare official and warehouse figures at `/reconciliation`, add dated updates, and view or edit records with the reconciliation role.
- Control national operational headline overrides with a per-record toggle that starts off; public headlines continue to use official figures independently.
- See actual Field / Before / After values in each record's audit trail, with actor and EAT timestamps. Record history stays separate from general audit views and remains available after clearing.
- Inspect retained filter values in both `/audit` and the operational Audit tab, with redacted free text and clear labels for unavailable historical values.
- Preserve edits when a concurrent change causes HTTP 409, then reload the latest record before retrying. Improve reconciliation and audit table readability on desktop and smaller screens.
