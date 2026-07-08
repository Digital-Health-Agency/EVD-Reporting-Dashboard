"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { fmt } from "@/lib/format";

const C = {
  tests: "#1a9bd2",
  positive: "#b42318",
  negative: "#1f7a4d",
  inconclusive: "#b7791f",
  pending: "#64748b",
  screened: "#0e6e63",
  alerts: "#0369a1",
  unknown: "#97a2ab",
};

const pctNum = (n) => `${Number(n || 0).toFixed(1)}%`;
const ratioPct = (value, total) => (total > 0 ? Math.min(100, (value / total) * 100) : 0);
const dayLabel = (iso) =>
  new Date(iso).toLocaleDateString("en-KE", { month: "short", day: "numeric" });

function Chart({ size = "chart-h", height, minWidth, children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const inner = (
    <div
      className={!height && !minWidth ? size : undefined}
      style={{
        width: "100%",
        ...(height && { height }),
        ...(minWidth && { height: 300, minWidth }),
      }}
    >
      {mounted ? (
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: minWidth || 640, height: height || 300 }}
        >
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );

  return minWidth ? <div className="chart-scroll">{inner}</div> : inner;
}

function Src({ prov }) {
  if (!prov) return null;
  if (prov.source === "live") {
    return (
      <span className="pill-live" title={prov.label}>
        <span className="pill-live__dot" aria-hidden="true" />Live
      </span>
    );
  }
  if (prov.source === "mock") {
    return <span className="pill-mock" title={prov.label}>Mock data</span>;
  }
  if (prov.source === "na") {
    return <span className="pill-pending" title={prov.label}>n/a</span>;
  }
  return <span className="pill-pending" title={prov.label}>Preview data</span>;
}

function SectionHead({ title, src, prov, children }) {
  return (
    <div className="section__head section__head--row">
      <div>
        <h2 className="section__title">{title}</h2>
        {src ? <p className="section__src">{src}</p> : null}
      </div>
      <div className="section__head-actions">
        {children}
        <Src prov={prov} />
      </div>
    </div>
  );
}

function ChartCard({ title, children, summary }) {
  return (
    <div className="card">
      <div className="card__head card__head--stack">
        <h3 className="card__title">{title}</h3>
        {summary ? <p className="card__summary">{summary}</p> : null}
      </div>
      {children}
    </div>
  );
}

function EmptyData({ children }) {
  return <div className="data-empty">{children}</div>;
}

function PriorityMetric({ tone, label, value, delta, detail }) {
  return (
    <article className={`brief-metric brief-metric--important brief-metric--${tone}`}>
      <span className="brief-metric__label">{label}</span>
      <strong className="brief-metric__value">{value}</strong>
      {delta ? <span className="brief-metric__delta">{delta}</span> : null}
      {detail ? <span className="brief-metric__detail">{detail}</span> : null}
    </article>
  );
}

function PlainMetric({ tone = "blue", label, value, hint }) {
  return (
    <article className="brief-metric brief-metric--plain">
      <span className="brief-metric__label">{label}</span>
      <strong className={`brief-metric__value is-${tone}`}>{value}</strong>
      {hint ? <span className="brief-metric__detail">{hint}</span> : null}
    </article>
  );
}

function FilterSummary({ disease, dateLabel, labRange, sourceMode }) {
  const filters = [
    { label: "Disease", value: disease },
    { label: "Period", value: labRange || "Latest available" },
    { label: "Geography", value: "National" },
    { label: "Sources", value: sourceMode },
    { label: "Updated", value: dateLabel },
  ];

  return (
    <div className="brief-filter-row" aria-label="Executive dashboard filters">
      {filters.map((filter) => (
        <div className="brief-filter" key={filter.label}>
          <span>{filter.label}</span>
          <strong>{filter.value}</strong>
        </div>
      ))}
    </div>
  );
}

function ProgressLine({ label, value, total, tone = "blue" }) {
  const percent = ratioPct(value, total);
  return (
    <div className="progress-line">
      <div className="progress-line__row">
        <span>{label}</span>
        <strong>{percent.toFixed(0)}%</strong>
      </div>
      <div className="progress-line__track" aria-label={`${percent.toFixed(0)} percent ${label}`}>
        <span className={`is-${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function SourceGrid({ prov }) {
  const rows = [
    ["Cases", prov.cases],
    ["Laboratory", prov.labs],
    ["Points of entry", prov.poe],
    ["Readiness", prov.readiness],
    ["Clinical and contacts", prov.clinical],
    ["Community", prov.community],
  ];

  return (
    <div className="source-grid">
      {rows.map(([label, source]) => (
        <div className="source-grid__item" key={label}>
          <span>{label}</span>
          <Src prov={source} />
        </div>
      ))}
    </div>
  );
}

function PreviewSection({ title, prov, blurb }) {
  return (
    <section className="section is-pending">
      <SectionHead title={title} prov={prov} />
      <div className="card">
        <p className="pending-copy">
          <strong>Preview - awaiting data source.</strong> {blurb}
        </p>
      </div>
    </section>
  );
}

const tooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid #e7ebef" };
const axisProps = { tick: { fontSize: 11, fill: "#69757f" }, axisLine: false, tickLine: false };
const legendStyle = { fontSize: 12 };
const gridProps = { strokeDasharray: "3 3", vertical: false, stroke: "#eef1f4" };
const barMargin = { top: 8, right: 8, left: -10, bottom: 0 };

export default function Dashboard({ data }) {
  const labs = data.labs;
  const cases = data.cases;
  const poe = data.poe;
  const prov = data.meta.provenance || {};
  const disease = data.meta.disease || "Disease";
  const readinessMetrics = data.readiness?.metrics || [];

  const dateLabel = useMemo(() => {
    const d = new Date(data.meta.lastUpdated);
    return d.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
  }, [data.meta.lastUpdated]);

  const labTrend = (labs.trend || []).map((r) => ({
    label: dayLabel(r.date),
    Tests: r.tests,
    Positive: r.positive,
    Negative: r.negative,
  }));

  const resultRows = [
    { name: "Negative", value: labs.negative, fill: C.negative },
    { name: "Positive", value: labs.positive, fill: C.positive },
    { name: "Inconclusive", value: labs.inconclusive, fill: C.inconclusive },
    { name: "Pending", value: labs.pendingResults || 0, fill: C.pending },
  ].filter((row) => row.value > 0);

  const poeRows = [...(poe.byPoe || [])]
    .map((p) => ({
      name: p.name,
      Screened: p.screened,
      Alerts: p.alerts || 0,
      fill: p.unknown ? C.unknown : C.screened,
    }))
    .sort((a, b) => b.Screened - a.Screened);
  const topPoeRows = poeRows.slice(0, 8);
  const hasPoeBreakdown = (poe.byPoe || []).some((p) => !p.unknown);

  const labRange = labs.firstTest && labs.lastTest ? `${labs.firstTest} to ${labs.lastTest}` : null;
  const asOfLab = labs.lastTest ? `as of ${labs.lastTest}` : null;
  const confirmed = cases.confirmed ?? 0;
  const deaths = cases.deaths ?? 0;
  const cfr = confirmed > 0 ? pctNum((deaths / confirmed) * 100) : "0%";
  const confirmed24h = cases.newConfirmed24h ?? 0;
  const tested24h = labs.newTested24h ?? 0;
  const alerts = poe.alerts ?? cases.suspected ?? 0;
  const contactFollowPct = ratioPct(cases.contactsFollowedUp || 0, cases.contactsListed || 0);
  const sourceMode = Object.values(prov).some((p) => p?.source === "pending")
    ? "Mixed live and pending"
    : "Current sources";

  return (
    <>
      <div className="report-head report-head--executive">
        <div>
          <h1>{disease} - Executive Situation Brief</h1>
          <p className="report-head__sub">
            Leadership view of cases, testing, screening, contacts and response readiness.
          </p>
        </div>
        <div className="report-head__controls">
          <span className="asof">As of {dateLabel}</span>
        </div>
      </div>

      <FilterSummary
        disease={disease}
        dateLabel={dateLabel}
        labRange={labRange}
        sourceMode={sourceMode}
      />

      <section className="brief-priority-grid" aria-label="Executive priority metrics">
        <PriorityMetric
          tone="alert"
          label="Confirmed cases"
          value={fmt(confirmed)}
          delta={`Last 24h +${fmt(confirmed24h)}`}
          detail={`${fmt(cases.suspected)} suspected under surveillance`}
        />
        <PriorityMetric
          tone="navy"
          label="Currently admitted"
          value={fmt(cases.admitted ?? 0)}
          delta={`Last 24h +${fmt(cases.newAdmissions24h ?? 0)}`}
          detail={`${fmt(cases.recoveries ?? 0)} cumulative recoveries`}
        />
        <PriorityMetric
          tone="critical"
          label="Deaths"
          value={fmt(deaths)}
          delta={`CFR ${cfr}`}
          detail={`Last 24h +${fmt(cases.newDeaths24h ?? 0)}`}
        />
      </section>

      <section className="brief-plain-grid" aria-label="Supporting executive metrics">
        <PlainMetric
          tone="green"
          label="Recoveries"
          value={fmt(cases.recoveries ?? 0)}
          hint={`Last 24h +${fmt(cases.newRecoveries24h ?? 0)}`}
        />
        <PlainMetric tone="blue" label="Tests done" value={fmt(labs.testsDone)} hint={`Last 24h +${fmt(tested24h)}`} />
        <PlainMetric tone="amber" label="Pending results" value={fmt(labs.pendingResults || 0)} hint="Lab result status" />
        <PlainMetric tone="blue" label="Positivity" value={pctNum(labs.positivityPct)} hint="Positive share of tests" />
        <PlainMetric tone="green" label="Travellers screened" value={fmt(poe.totalScreened)} hint="All reporting POEs" />
        <PlainMetric tone="blue" label="POE alerts" value={fmt(alerts)} hint="Secondary screening / alerts" />
        <PlainMetric tone="blue" label="Contacts listed" value={fmt(cases.contactsListed || 0)} hint="Contacts listing form" />
        <PlainMetric tone="green" label="Follow-up reached" value={`${contactFollowPct.toFixed(0)}%`} hint={`${fmt(cases.contactsFollowedUp || 0)} followed up`} />
      </section>

      <section className="section">
        <SectionHead title="Laboratory Results" src="Source: marts.lab_by_disease / lab_daily" prov={prov.labs} />
        <div className="charts-wide">
          <ChartCard
            title={`Daily testing trend${asOfLab ? ` (${asOfLab})` : ""}`}
            summary="Trend chart for tests, positives and negatives."
          >
            {labTrend.length ? (
              <Chart minWidth={560}>
                <LineChart data={labTrend} margin={barMargin}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" {...axisProps} minTickGap={20} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={legendStyle} />
                  <Line type="monotone" dataKey="Tests" stroke={C.tests} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Positive" stroke={C.positive} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Negative" stroke={C.negative} strokeWidth={2} dot={false} />
                </LineChart>
              </Chart>
            ) : (
              <EmptyData>Daily laboratory trend appears once lab_daily is available.</EmptyData>
            )}
          </ChartCard>
          <ChartCard title="Result status" summary="Direct comparison of negative, positive, inconclusive and pending results.">
            {resultRows.length ? (
              <Chart height={300}>
                <BarChart data={resultRows} layout="vertical" margin={{ top: 8, right: 26, left: 18, bottom: 8 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis type="number" {...axisProps} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={86} {...axisProps} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmt(v)} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {resultRows.map((row) => <Cell key={row.name} fill={row.fill} />)}
                  </Bar>
                </BarChart>
              </Chart>
            ) : (
              <EmptyData>Result breakdown is awaiting laboratory values.</EmptyData>
            )}
          </ChartCard>
        </div>
      </section>

      <section className="section">
        <SectionHead title="Screening at Points of Entry" src="Source: marts.screenings_by_poe" prov={prov.poe} />
        <div className="charts-wide">
          <ChartCard title="Screened by point of entry" summary="Top reporting points of entry by traveller screening volume.">
            {hasPoeBreakdown ? (
              <Chart minWidth={Math.max(520, topPoeRows.length * 78)}>
                <BarChart data={topPoeRows} margin={{ top: 8, right: 24, left: -10, bottom: 48 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...axisProps} interval={0} angle={-30} textAnchor="end" tick={{ fontSize: 11, fill: "#69757f" }} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmt(v)} />
                  <Bar dataKey="Screened" radius={[3, 3, 0, 0]}>
                    {topPoeRows.map((row) => <Cell key={row.name} fill={row.fill} />)}
                  </Bar>
                </BarChart>
              </Chart>
            ) : (
              <EmptyData>
                Per-POE breakdown appears once marts.screenings_by_poe is published. The screening total remains visible above.
              </EmptyData>
            )}
          </ChartCard>
          <ChartCard title="Top POE table" summary="Exact values for briefing notes and EOC handoff.">
            {topPoeRows.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Point of entry</th>
                      <th className="num">Screened</th>
                      <th className="num">Alerts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPoeRows.map((row) => (
                      <tr key={row.name}>
                        <td>{row.name}</td>
                        <td className="num">{fmt(row.Screened)}</td>
                        <td className="num">{fmt(row.Alerts)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyData>No point-of-entry rows are available yet.</EmptyData>
            )}
          </ChartCard>
        </div>
        {poe.note ? <p className="section__src section__note">Note: {poe.note}</p> : null}
      </section>

      <section className="section">
        <SectionHead title="Response Pillars" prov={prov.readiness} />
        <div className="pillar-grid">
          <article className="pillar-card">
            <div>
              <h3>Clinical management</h3>
              <p>Admissions, outcomes and case fatality from health facility and EMR indicators.</p>
            </div>
            <PlainMetric tone="amber" label="Admitted" value={fmt(cases.admitted ?? 0)} hint="Current treatment burden" />
          </article>
          <article className="pillar-card">
            <div>
              <h3>Contacts</h3>
              <p>Contacts listed, reached and monitored through the 21-day follow-up window.</p>
            </div>
            <ProgressLine label="Follow-up reached" value={cases.contactsFollowedUp || 0} total={cases.contactsListed || 0} tone="green" />
          </article>
          <article className="pillar-card">
            <div>
              <h3>Laboratory</h3>
              <p>Testing volume, pending results, positivity and turnaround readiness.</p>
            </div>
            <PlainMetric tone="blue" label="Avg TAT" value={labs.avgTatDays == null ? "--" : `${labs.avgTatDays}d`} hint="Computed from lab dates" />
          </article>
          <article className="pillar-card">
            <div>
              <h3>Readiness</h3>
              <p>Training, surge capacity, beds and laboratory readiness indicators.</p>
            </div>
            {readinessMetrics.length ? (
              <ul className="mini-metric-list">
                {readinessMetrics.slice(0, 5).map((metric) => (
                  <li key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{fmt(metric.value)}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyData>Readiness source pending.</EmptyData>
            )}
          </article>
        </div>
      </section>

      <section className="section">
        <SectionHead title="Source Status" />
        <div className="card">
          <SourceGrid prov={prov} />
        </div>
      </section>

      <PreviewSection
        title="Community Surveillance"
        prov={prov.community}
        blurb="Signals generated by CHPs, verified signals linked to facilities by CHAs, and contacts traced will appear once eCHIS, M-Dharura, EBS Connect or KRCS source marts are connected."
      />

      <footer className="footer">
        Executive metrics use the dashboard API data contract. Pending sections remain labelled and are not filled with operational records.
      </footer>
    </>
  );
}
