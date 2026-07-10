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

