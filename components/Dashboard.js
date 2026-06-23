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

function Chart({ size = "chart-h", height, children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className={height ? undefined : size} style={height ? { width: "100%", height } : undefined}>
      {mounted ? <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer> : null}
    </div>
  );
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
  if (prov.source === "na") {
    return <span className="pill-pending" title={prov.label}>n/a</span>;
  }
  return <span className="pill-pending" title={prov.label}>Preview · awaiting data</span>;
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

// A section with no backing mart yet: clearly a preview, never faked.
function PreviewSection({ title, prov, blurb }) {
  return (
    <section className="section is-pending">
      <SectionHead title={title} prov={prov} />
      <div className="card">
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
          <strong>Preview — awaiting data source.</strong> {blurb}
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

  const dateLabel = useMemo(() => {
    const d = new Date(data.meta.lastUpdated);
    return d.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
  }, [data.meta.lastUpdated]);

  // Results trend — positive, negative, tests only (no inconclusive).
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
    ? `${labs.firstTest} → ${labs.lastTest}` : null;
  const asOfLab = labs.lastTest ? `as of ${labs.lastTest}` : null;

  return (
    <>
      {/* Report header */}
      <div className="report-head">
        <div>
          <h1>{disease} — National Situation Report</h1>
          <p className="report-head__sub">
            Positive cases, screening at points of entry and laboratory testing from the analytics warehouse
          </p>
        </div>
        <div className="report-head__controls">
          <span className="asof">As of {dateLabel}</span>
        </div>
      </div>

      {/* 1) Positive Cases — one big headline number */}
      <section className="hero">
        <div className="hero__label">Positive cases — {disease}</div>
        <div className="hero__value">{fmt(labs.positive)}</div>
        <div className="hero__sub">
          <span className="pill-live"><span className="pill-live__dot" />Live</span>
          Lab-confirmed positives · positivity {pctNum(labs.positivityPct)} · {fmt(labs.testsDone)} tests done
        </div>
      </section>

      {/* 2) Total screened + Suspected cases (top row) + Screened by Point of Entry (bottom) */}
      <section className="section">
        <SectionHead title="Screening at Points of Entry" src="Source: marts.screenings_by_poe" prov={prov.poe} />
        
        {/* Top row: Total screened (left) + Suspected cases (right) */}
        <div className="kpis" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 24 }}>
          <Kpi featured variant="green" live label="Total screened" value={fmt(poe.totalScreened)} delta="all points of entry" />
          {cases.available && (
            <Kpi featured variant="blue" live label="Suspected cases" value={fmt(cases.suspected)} delta={`${disease} suspected`} />
          )}
        </div>
        
        {/* Bottom: Screened by point of entry chart */}
        {hasPoeBreakdown ? (
            <ChartCard title="Screened by point of entry">
              <Chart height={Math.max(300, poeRows.length * 34)}>
                <BarChart data={poeRows} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                  <CartesianGrid {...gridProps} horizontal={false} />
                  <XAxis type="number" {...axisProps} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" {...axisProps} width={170} interval={0} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmt(v)} />
                  <Bar dataKey="Screened" radius={[0, 3, 3, 0]}>
                    {poeRows.map((r, i) => <Cell key={i} fill={r.fill} />)}
                  </Bar>
                </BarChart>
              </Chart>
            </ChartCard>
          ) : (
            <div className="card">
              <h3 className="card__title">Screened by point of entry</h3>
              <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                The per–point-of-entry breakdown (JKIA, Busia, Moi, …) appears here once
                <strong> marts.screenings_by_poe</strong> is published in this environment. The
                screening total on the left is live.
              </p>
            </div>
          )}
        {poe.note ? <p className="section__src" style={{ marginTop: 10 }}>⚠ {poe.note}</p> : null}
      </section>


      {/* 4) Laboratory testing */}
      <section className="section">
        <SectionHead
          title="Laboratory Testing"
          src={`Source: marts.lab_by_disease${labRange ? ` · ${labRange}` : ""}`}
          prov={prov.labs}
        />
        <div className="kpis">
          <Kpi featured variant="blue" live label="Tests done" value={fmt(labs.testsDone)} delta={`${disease} lab results`} />
          <Kpi variant="blue" label="Patients tested" value={fmt(labs.patientsTested)} />
          <Kpi variant="amber" label="Positivity %" value={pctNum(labs.positivityPct)} delta="positive / resolved" />
          <Kpi label="Avg turnaround" value={labs.avgTatDays == null ? "—" : `${labs.avgTatDays} days`} delta="specimen → result" />
        </div>
      </section>

      {/* 6) Results — positive / negative only */}
      <section className="section">
        <SectionHead title="Laboratory Results" src="Source: marts.lab_by_disease / lab_daily" prov={prov.labs} />
        <div className="kpis" style={{ marginBottom: 16 }}>
          <Kpi variant="red" label="Positive" value={fmt(labs.positive)} />
          <Kpi variant="green" label="Negative" value={fmt(labs.negative)} />
        </div>
        <div className="charts-wide">
          <ChartCard title={`Daily trend — positive & negative${asOfLab ? ` (${asOfLab})` : ""}`}>
            <Chart>
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
        Live metrics are read from the ClickHouse Gold marts (lab_by_disease, lab_daily,
        cases_by_disease) via the dashboard’s API layer, plus interim traveller-screening totals
        from stg_adam.screenings (point-of-entry breakdown appears once the source records it).
        Sections marked “preview” are awaiting their data source and are never populated with
        placeholder figures. Ebola/Marburg show 0 positives — that is correct (no active outbreak).
      </footer>
    </>
  );
}
