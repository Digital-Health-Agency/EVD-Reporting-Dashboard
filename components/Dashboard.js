"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart, Bar, Cell,
  LineChart, Line,
  PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { fmt } from "@/lib/format";

const C = {
  tests: "#1f6feb",
  positive: "#c0392b",
  negative: "#1f9254",
  screened: "#0e6e63",
  unknown: "#97a2ab",
};

const pctNum = (n) => `${Number(n || 0).toFixed(1)}%`;
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
      {mounted ? <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer> : null}
    </div>
  );

  return minWidth ? <div className="chart-scroll">{inner}</div> : inner;
}

function Kpi({ variant, featured, label, value, delta, badge, live }) {
  const cls = ["kpi", featured && "kpi--featured", variant && `kpi--${variant}`]
    .filter(Boolean).join(" ");
  return (
    <div className={cls}>
      <div className="kpi__label">{label}</div>
      <div className="kpi__value">{value}</div>
      {delta ? (
        <div className="kpi__delta">
          {live ? <span className="kpi__pulse" aria-hidden="true" /> : null}
          {delta}
        </div>
      ) : null}
      {badge ? <span className="kpi__badge">{badge}</span> : null}
    </div>
  );
}

// Provenance marker: live / awaiting / not-applicable.
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

function SectionHead({ title, src, prov }) {
  return (
    <div className="section__head section__head--row">
      <div>
        <h2 className="section__title">{title}</h2>
        {src ? <p className="section__src">{src}</p> : null}
      </div>
      <Src prov={prov} />
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="card">
      <h3 className="card__title">{title}</h3>
      {children}
    </div>
  );
}

// Composite summary card: a marker + title, one featured metric box, then
// labelled detail rows.
function StatCard({ title, markerColor, accent, feature, rows = [] }) {
  return (
    <div className="statcard">
      <div className="statcard__head">
        {markerColor ? <span className="statcard__marker" style={{ "--marker-color": markerColor }} aria-hidden="true" /> : null}
        <h3 className="statcard__title">{title}</h3>
      </div>
      <div className={`statcard__feature statcard__feature--${accent}`}>
        <div className="statcard__feature-label">{feature.label}</div>
        <div className="statcard__feature-value">{feature.value}</div>
        {feature.delta ? <div className="statcard__feature-delta">{feature.delta}</div> : null}
      </div>
      <div className="statcard__rows">
        {rows.map((r) => (
          <div className="statcard__row" key={r.label}>
            <div>
              <div className="statcard__row-label">{r.label}</div>
              {r.sub ? <div className="statcard__row-sub">{r.sub}</div> : null}
            </div>
            <div className={`statcard__row-value ${r.color ? `is-${r.color}` : ""}`}>{r.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// A section with no backing mart yet: clearly a preview, never faked.
function PreviewSection({ title, prov, blurb }) {
  return (
    <section className="section is-pending">
      <SectionHead title={title} prov={prov} />
      <div className="card">
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
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

  // Results trend - positive, negative, tests only (no inconclusive).
  const labTrend = (labs.trend || []).map((r) => ({
    label: dayLabel(r.date), Tests: r.tests, Positive: r.positive, Negative: r.negative,
  }));
  const labPie = [
    { name: "Negative", value: labs.negative, fill: C.negative },
    { name: "Positive", value: labs.positive, fill: C.positive },
  ].filter((d) => d.value > 0);

  const poeRows = (poe.byPoe || []).map((p) => ({
    name: p.name, Screened: p.screened, fill: p.unknown ? C.unknown : C.screened,
  }));
  const hasPoeBreakdown = (poe.byPoe || []).some((p) => !p.unknown);

  const labRange = labs.firstTest && labs.lastTest
    ? `${labs.firstTest} to ${labs.lastTest}` : null;
  const asOfLab = labs.lastTest ? `as of ${labs.lastTest}` : null;

  const confirmed = cases.confirmed ?? 0;
  const cfr = confirmed > 0 ? pctNum((cases.deaths / confirmed) * 100) : "0%";
  const confirmed24h = cases.newConfirmed24h ?? 0;
  const tested24h = labs.newTested24h ?? 0;
  const alerts = poe.alerts ?? cases.suspected ?? 0;

  return (
    <>
      {/* Report header */}
      <div className="report-head">
        <div>
          <h1>{disease} - National Situation Report</h1>
          <p className="report-head__sub">
            Cases, screening at points of entry and laboratory testing from the dashboard API
          </p>
        </div>
        <div className="report-head__controls">
          <span className="asof">As of {dateLabel}</span>
        </div>
      </div>

      {/* 1) Headline summary cards - Cases (priority) + Samples Tested */}
      <section className="stat-grid">
        <StatCard
          title="Cases"
          markerColor="var(--red)"
          accent="red"
          feature={{
            label: "Confirmed",
            value: fmt(confirmed),
            delta: `Last 24h: +${fmt(confirmed24h)}`,
          }}
          rows={[
            { label: "Recoveries", value: fmt(cases.recoveries ?? 0), color: "green" },
            { label: "Deaths", value: fmt(cases.deaths), color: "red" },
            { label: "CFR", value: cfr, color: "amber" },
          ]}
        />
        <StatCard
          title="Samples Tested"
          markerColor="var(--blue)"
          accent="blue"
          feature={{
            label: "Total Tested",
            value: fmt(labs.testsDone),
            delta: `Last 24h: +${fmt(tested24h)}`,
          }}
          rows={[
            { label: "Positive", value: fmt(labs.positive), color: "red" },
            { label: "Negative", value: fmt(labs.negative), color: "green" },
          ]}
        />
      </section>

      {/* 2) Total screened + Alerts (top row) + Screened by Point of Entry (bottom) */}
      <section className="section">
        <SectionHead title="Screening at Points of Entry" src="Source: marts.screenings_by_poe" prov={prov.poe} />
        
        {/* Top row: Total screened (left) + Alerts (right) */}
        <div className="kpis" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 24 }}>
          <Kpi featured variant="green" live label="Total screened" value={fmt(poe.totalScreened)} delta="all points of entry" />
          {cases.available && (
            <Kpi featured variant="blue" live label="Alerts" value={fmt(alerts)} delta={`${disease} alerts`} />
          )}
        </div>
        
        {/* Bottom: Screened by point of entry chart */}
        {hasPoeBreakdown ? (
            <ChartCard title="Screened by point of entry">
              <Chart minWidth={Math.max(400, poeRows.length * 72)}>
                <BarChart data={poeRows} margin={{ top: 8, right: 24, left: -10, bottom: 48 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...axisProps} interval={0} angle={-30} textAnchor="end" tick={{ fontSize: 11, fill: "#69757f" }} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmt(v)} />
                  <Bar dataKey="Screened" radius={[3, 3, 0, 0]}>
                    {poeRows.map((r, i) => <Cell key={i} fill={r.fill} />)}
                  </Bar>
                </BarChart>
              </Chart>
            </ChartCard>
          ) : (
            <div className="card">
              <h3 className="card__title">Screened by point of entry</h3>
              <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                The per-point-of-entry breakdown (JKIA, Busia, Moi, and others) appears here once
                <strong> marts.screenings_by_poe</strong> is published in this environment. The
                screening total on the left is live.
              </p>
            </div>
          )}
        {poe.note ? <p className="section__src" style={{ marginTop: 10 }}>Note: {poe.note}</p> : null}
      </section>


      {/* 4) Training and readiness */}
      <section className="section">
        <SectionHead title="Training and Readiness" prov={prov.readiness} />
        <div className="card">
          <div className="kpis" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginTop: 8 }}>
            {readinessMetrics.map((metric) => (
              <Kpi key={metric.label} variant="blue" label={metric.label} value={fmt(metric.value)} />
            ))}
          </div>
        </div>
      </section>

      {/* 6) Results - positive / negative only */}
      <section className="section">
        <SectionHead title="Laboratory Results" src="Source: marts.lab_by_disease / lab_daily" prov={prov.labs} />
        <div className="charts-wide">
          <ChartCard title={`Daily trend - positive and negative${asOfLab ? ` (${asOfLab})` : ""}`}>
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
          </ChartCard>
          <ChartCard title="Results breakdown (positive vs negative)">
            <Chart>
              <PieChart>
                <Pie data={labPie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={legendStyle} />
              </PieChart>
            </Chart>
          </ChartCard>
        </div>
      </section>

      {/* Sections without a backing mart yet */}
      <PreviewSection
        title="Clinical Management & Contacts"
        prov={prov.clinical}
        blurb="Admissions, recoveries, case-fatality and contacts traced will appear here once the clinical/contacts marts are published."
      />
      <PreviewSection
        title="Community Surveillance"
        prov={prov.community}
        blurb="Community signals (eCHIS, M-Dharura) generated vs verified will appear here once that mart is available."
      />

      <footer className="footer">
        Metrics are read through the dashboard API layer. Mock data is used for local UI
        development unless DATA_SOURCE=live is set. Sections marked preview are awaiting
        their data source and are never populated with operational records.
      </footer>
    </>
  );
}
