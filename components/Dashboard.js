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
  inconclusive: "#c98a04",
  screened: "#0e6e63",
  unknown: "#97a2ab",
  confirmed: "#0e6e63",
  suspected: "#1f6feb",
  deaths: "#c0392b",
};

const pctNum = (n) => `${Number(n || 0).toFixed(1)}%`;
const dayLabel = (iso) =>
  new Date(iso).toLocaleDateString("en-KE", { month: "short", day: "numeric" });

function Chart({ size = "chart-h", children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className={size}>
      {mounted ? <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer> : null}
    </div>
  );
}

function Kpi({ variant, label, value, delta, badge, live }) {
  return (
    <div className={`kpi ${variant ? `kpi--${variant}` : ""}`}>
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

  const labTrend = (labs.trend || []).map((r) => ({
    label: dayLabel(r.date), Tests: r.tests, Positive: r.positive, Negative: r.negative,
  }));
  const labPie = [
    { name: "Negative", value: labs.negative, fill: C.negative },
    { name: "Positive", value: labs.positive, fill: C.positive },
    { name: "Inconclusive", value: labs.inconclusive, fill: C.inconclusive },
  ].filter((d) => d.value > 0);

  const poeRows = (poe.byPoe || []).map((p) => ({
    name: p.name, Screened: p.screened, fill: p.unknown ? C.unknown : C.screened,
  }));

  const labRange = labs.firstTest && labs.lastTest
    ? `${labs.firstTest} → ${labs.lastTest}` : null;

  return (
    <>
      {/* Report header */}
      <div className="report-head">
        <div>
          <h1>{disease} — National Situation Report</h1>
          <p className="report-head__sub">
            Laboratory, case surveillance and points-of-entry overview from the analytics warehouse
          </p>
        </div>
        <div className="report-head__controls">
          <span className="asof">As of {dateLabel}</span>
        </div>
      </div>

      {/* ---------- Laboratory (LIVE) ---------- */}
      <section className="section">
        <SectionHead
          title="Laboratory"
          src={`Source: marts.lab_by_disease / lab_daily${labRange ? ` · ${labRange}` : ""}`}
          prov={prov.labs}
        />
        {!labs.available ? (
          <div className="card"><p style={{ margin: 0, color: "var(--muted)" }}>No laboratory data for {disease}.</p></div>
        ) : (
          <>
            <div className="kpis" style={{ marginBottom: 16 }}>
              <Kpi variant="featured" badge="Priority indicator" live label="Positive tests" value={fmt(labs.positive)} delta={`${disease} · positivity ${pctNum(labs.positivityPct)}`} />
              <Kpi label="Tests done" value={fmt(labs.testsDone)} delta={`${disease} lab results`} />
              <Kpi variant="green" label="Negative tests" value={fmt(labs.negative)} />
              <Kpi variant="amber" label="Inconclusive" value={fmt(labs.inconclusive)} />
              <Kpi variant="red" label="Positivity %" value={pctNum(labs.positivityPct)} delta="positive / resolved" />
              <Kpi variant="blue" label="Total screened" value={fmt(labs.patientsTested)} delta="patients tested" />
              <Kpi label="Avg turnaround" value={labs.avgTatDays == null ? "—" : `${labs.avgTatDays} days`} delta={labs.avgTatDays == null ? "awaiting data" : "specimen → result"} />
            </div>
            <div className="charts-wide">
              <ChartCard title="Tests over time (by test date)">
                <Chart>
                  <LineChart data={labTrend} margin={barMargin}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="label" {...axisProps} minTickGap={24} />
                    <YAxis {...axisProps} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={legendStyle} />
                    <Line type="monotone" dataKey="Tests" stroke={C.tests} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Positive" stroke={C.positive} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Negative" stroke={C.negative} strokeWidth={2} dot={false} />
                  </LineChart>
                </Chart>
              </ChartCard>
              <ChartCard title="Test results breakdown">
                <Chart>
                  <PieChart>
                    <Pie data={labPie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={legendStyle} />
                  </PieChart>
                </Chart>
              </ChartCard>
            </div>
          </>
        )}
      </section>

      {/* ---------- Case Surveillance (LIVE) ---------- */}
      <section className="section">
        <SectionHead title="Case Surveillance" src="Source: marts.cases_by_disease (ADaM)" prov={prov.cases} />
        {!cases.available ? (
          <div className="card">
            <p style={{ margin: 0, color: "var(--muted)" }}>
              No ADaM case records for {disease} (lab data exists, but this disease isn’t in the case mart).
            </p>
          </div>
        ) : (
          <div className="kpis">
            <Kpi variant="blue" label="Suspected cases" value={fmt(cases.suspected)} />
            <Kpi variant="green" label="Confirmed" value={fmt(cases.confirmed)} />
            <Kpi variant="red" label="Deaths" value={fmt(cases.deaths)} />
            <Kpi label="Probable" value={fmt(cases.probable)} />
            <Kpi label="Total cases" value={fmt(cases.totalCases)} />
            <Kpi label="With specimen ID" value={fmt(cases.withSpecimenId)} delta="linked to a lab specimen" />
          </div>
        )}
      </section>

      {/* ---------- Points of Entry (LIVE, interim source) ---------- */}
      <section className="section">
        <SectionHead title="Points of Entry" src="Source: stg_adam.screenings · all-hazards traveller screening (interim)" prov={prov.poe} />
        <div className="charts-wide">
          <ChartCard title="Screenings by point of entry">
            <Chart>
              <BarChart data={poeRows} margin={barMargin}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="name" {...axisProps} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis {...axisProps} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="Screened" radius={[3, 3, 0, 0]}>
                  {poeRows.map((r, i) => <Cell key={i} fill={r.fill} />)}
                </Bar>
              </BarChart>
            </Chart>
          </ChartCard>
          <div className="kpis" style={{ gridTemplateColumns: "1fr", alignContent: "start" }}>
            <Kpi variant="green" label="Total screened" value={fmt(poe.totalScreened)} delta="all points of entry" />
            <Kpi variant="blue" label="Unique travelers" value={fmt(poe.uniqueTravelers)} />
          </div>
        </div>
        {poe.note ? (
          <p className="section__src" style={{ marginTop: 10 }}>⚠ {poe.note}</p>
        ) : null}
      </section>

      {/* ---------- Sections without a backing mart yet ---------- */}
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
      <PreviewSection
        title="Geographic Spread"
        prov={prov.geographic}
        blurb="County / sub-county breakdown of cases will appear here once a geographic mart is published."
      />

      <footer className="footer">
        Live metrics are read from the ClickHouse Gold marts (lab_by_disease, lab_daily,
        cases_by_disease) via the dashboard’s API layer, plus interim traveller-screening totals
        from stg_adam.screenings. Sections marked “preview” are awaiting their data source and are
        never populated with placeholder figures. Ebola/Marburg currently show 0% positivity — that
        is correct (no active outbreak), not a data error.
      </footer>
    </>
  );
}
