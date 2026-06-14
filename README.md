# EVD Reporting Dashboard

A high-level national reporting dashboard for the **Ebola Virus Disease (EVD)** response in Kenya. It gives decision-makers an at-a-glance view of the outbreak — headline case numbers, epidemic trend, county breakdown, and the operational response pillars — on a single, uncluttered screen.

Built for the **Ministry of Health, Kenya** and powered by the **Digital Health Agency (DHA)**.

> The figures currently shown are illustrative sample data for layout and review purposes. Connect a live data source before any operational use (see [Data layer](#data-layer)).

---

## Features

- **Headline KPIs** — confirmed cases, currently admitted, deaths (with case fatality rate), and recoveries, each with 24-hour change and sex disaggregation.
- **Epidemic trend** — bar chart of suspected, confirmed, deaths and recoveries, switchable across *Last 24 hours / Last 7 days / Cumulative*.
- **County breakdown** — comparison chart and table of confirmed, admitted, deaths and recoveries by county.
- **Response pillars** — concise panels for Points of Entry, Contact Tracing, Community Surveillance, and Laboratory.

All indicators map directly to the national EVD reporting matrix across the POE, Health Facility, Community, and Laboratory service points.

## Indicators covered

| Service point | Indicators |
| --- | --- |
| **Points of Entry (POE)** | No. screened · No. suspected cases · Contacts listed |
| **Health Facility (HF)** | Suspected cases · New confirmed (24h) · Total confirmed · Currently admitted · Deaths (24h) · Total deaths · Recoveries (24h) · Total recoveries · Case fatality rate · Contacts listed · Contacts followed up |
| **Community** | Signals generated (CHPs) · Verified signals linked to facilities (CHAs) · Contacts traced |
| **Laboratory** | Tests done · Positive tests · Negative tests · Turnaround time (TAT) |

Disaggregation by **sex** and filtering by **period** and **county** follow the source reporting matrix.

## Tech stack

- [Next.js](https://nextjs.org/) (App Router) + React
- [Chart.js](https://www.chartjs.org/) via [react-chartjs-2](https://react-chartjs-2.js.org/)
- Plain CSS (no UI framework)

## Getting started

Requirements: Node.js 18.18+ (Node 20 recommended).

```bash
# install dependencies
npm install

# start the development server
npm run dev
```

Open <http://localhost:3000> in your browser.

### Other scripts

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # lint
```

## Project structure

```
.
├── app/
│   ├── layout.js          # root layout + metadata
│   ├── page.js            # server component; loads data, renders the dashboard
│   └── globals.css        # global styles
├── components/
│   ├── Dashboard.js       # main client component (KPIs, charts, tables)
│   └── registerCharts.js  # Chart.js registration
├── lib/
│   ├── data.js            # sample data + getDashboardData() loader
│   └── format.js          # number/percentage formatting helpers
├── public/                # logos and static assets
└── static-prototype/      # original static HTML prototype (reference only)
```

## Data layer

All data is served through a single loader so the UI never changes when the
backend does. See [`lib/data.js`](lib/data.js):

```js
export async function getDashboardData() {
  return dashboardData; // replace with a fetch() to your API / DHIS2 export
}
```

To go live, replace the body of `getDashboardData()` with a call to your data
source (REST API, DHIS2, or a scheduled export) that returns the same shape as
the sample object. No component changes are required.

## License

© Ministry of Health, Kenya · Digital Health Agency. All rights reserved.
