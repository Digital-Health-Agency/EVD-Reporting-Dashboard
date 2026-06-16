"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { fmt, pct, splitText } from "@/lib/format";

const C = {
  suspected: "#1f6feb",
  confirmed: "#0e6e63",
  deaths: "#c0392b",
  recoveries: "#1f9254",
  screened: "#7cc0ec",
  male: "#0e6e63",
  female: "#e3a008",
  signals: "#97a2ab",
  verified: "#1f9254",
  positive: "#c0392b",
  negative: "#1f9254",
};

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

function SectionHead({ title, src }) {
  return (
    <div className="section__head">
      <h2 className="section__title">{title}</h2>
      {src ? <p className="section__src">{src}</p> : null}
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

const tooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid #e7ebef" };
const axisProps = { tick: { fontSize: 11, fill: "#69757f" }, axisLine: false, tickLine: false };
const legendStyle = { fontSize: 12 };
const gridProps = { strokeDasharray: "3 3", vertical: false, stroke: "#eef1f4" };
const barMargin = { top: 8, right: 8, left: -10, bottom: 0 };

export default function Dashboard({ data }) {
  const [period, setPeriod] = useState("7d");

  const s = data.summary;
  const hf = data.healthFacilities;
  const comm = data.community;
  const poe = data.pointsOfEntry;
  const labs = data.labs;

  const dateLabel = useMemo(() => {
    const d = new Date(data.meta.lastUpdated);
    return d.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
  }, [data.meta.lastUpdated]);

  // Epidemic trend with period handling
  const trendRows = useMemo(() => {
    let rows = data.trend.map((r) => ({ label: dayLabel(r.date), ...r }));
    if (period === "cumulative") {
      const acc = { suspected: 0, confirmed: 0, deaths: 0, recoveries: 0 };
      rows = rows.map((r) => {
        acc.suspected += r.suspected; acc.confirmed += r.confirmed;
        acc.deaths += r.deaths; acc.recoveries += r.recoveries;
        return { ...r, ...acc };
      });
    } else if (period === "24h") {
      rows = rows.slice(-1);
    }
    return rows;
  }, [data.trend, period]);

  const periodLabel = period === "cumulative" ? "cumulative" : period === "24h" ? "last 24h" : "last 7 days";

  const poeRows = poe.byEntryPoint.map((e) => ({ name: e.name, Screened: e.screened, Suspected: e.suspected }));
  const commRows = comm.trend.map((r) => ({ label: dayLabel(r.date), Signals: r.signals, Verified: r.verified }));
  const labRows = labs.trend.map((r) => ({ label: dayLabel(r.date), Positive: r.positive, Negative: r.negative }));
  const countyRows = data.counties.map((c) => ({ name: c.county, Confirmed: c.confirmed, Deaths: c.deaths, Recoveries: c.recoveries }));

  const poeSexPie = [
    { name: "Male", value: poe.contactsListed.male, fill: C.male },
    { name: "Female", value: poe.contactsListed.female, fill: C.female },
  ];
  const hfSexPie = [
    { name: "Male", value: hf.suspectedCases.male, fill: C.male },
    { name: "Female", value: hf.suspectedCases.female, fill: C.female },
  ];
  const labResultPie = [
    { name: "Negative", value: labs.negativeTests, fill: C.negative },
    { name: "Positive", value: labs.positiveTests, fill: C.positive },
  ];

  return (
    <>
      {/* App bar */}
      <header className="appbar">
        <div className="appbar__inner">
          <div className="brand">
            <Image className="brand__logo" src="/moh-kenya.png" alt="Ministry of Health" width={246} height={46} priority />
            <div className="brand__divider" />
            <div className="brand__text">
              <strong>Ministry of Health, Kenya</strong>
              <span>National Emergency Operations Centre</span>
            </div>
          </div>
          <div className="partner">
            <span className="partner__label">Powered by</span>
            <Image className="partner__logo" src="/dhalogo.png" alt="Digital Health Agency" width={69} height={34} />
          </div>
        </div>
      </header>

      <div className="container">
        {/* Report header */}
        <div className="report-head">
          <div>
            <h1>Ebola Virus Disease — National Situation Report</h1>
            <p className="report-head__sub">
              Surveillance overview across points of entry, health facilities, community and laboratory
            </p>
          </div>
          <div className="report-head__controls">
            <span className="asof">As of {dateLabel}</span>
            <select className="select" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="cumulative">Cumulative</option>
            </select>
          </div>
        </div>

        {/* Headline KPIs */}
        <section className="kpis">
          <Kpi variant="featured" badge="Priority indicator" live label="Confirmed cases" value={fmt(s.confirmedCasesTotal.total)} delta={`+${s.newConfirmed24h.total} in last 24h`} />
          <Kpi label="Total screened" value={fmt(poe.screened)} delta="At points of entry" />
          <Kpi variant="blue" label="Suspected cases" value={fmt(s.suspectedCases.total)} delta={splitText(s.suspectedCases)} />
          <Kpi variant="amber" label="Currently admitted" value={fmt(s.currentlyAdmitted.total)} delta={splitText(s.currentlyAdmitted)} />
          <Kpi variant="red" label="Deaths" value={fmt(s.totalDeaths.total)} delta={`CFR ${pct(s.caseFatalityRate)} · +${s.newDeaths24h.total} in 24h`} />
          <Kpi variant="green" label="Recoveries" value={fmt(s.totalRecoveries.total)} delta={`+${s.newRecoveries24h.total} in last 24h`} />
        </section>

        {/* ---------- Points of Entry ---------- */}
        <section className="section">
          <SectionHead title="Points of Entry" src="Source: ADaM (Ebola CIF) · near real-time" />
          <div className="charts-wide">
            <ChartCard title="Screened vs suspected by point of entry">
              <Chart>
                <BarChart data={poeRows} margin={barMargin}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...axisProps} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={legendStyle} />
                  <Bar dataKey="Screened" fill={C.screened} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Suspected" fill={C.female} radius={[3, 3, 0, 0]} />
                </BarChart>
              </Chart>
            </ChartCard>

            <div className="stack">
              <div className="kpis" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <Kpi label="Screened" value={fmt(poe.screened)} />
                <Kpi variant="blue" label="Suspected" value={fmt(poe.suspectedCases)} />
              </div>
              <ChartCard title="Contacts listed by sex">
                <Chart size="chart-h--sm">
                  <PieChart>
                    <Pie data={poeSexPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={legendStyle} />
                  </PieChart>
                </Chart>
              </ChartCard>
            </div>
          </div>
        </section>

        {/* ---------- Health Facilities ---------- */}
        <section className="section">
          <SectionHead title="Health Facilities" src="Source: TC EMRs, ADaM CIF, Labs, Civil Registries (D1) · daily" />
          <div className="kpis" style={{ marginBottom: 16 }}>
            <Kpi variant="blue" label="Suspected" value={fmt(hf.suspectedCases.total)} />
            <Kpi label="New confirmed (24h)" value={fmt(hf.newConfirmed24h.total)} />
            <Kpi label="Total confirmed" value={fmt(hf.totalConfirmed.total)} />
            <Kpi variant="amber" label="Currently admitted" value={fmt(hf.currentlyAdmitted.total)} />
            <Kpi variant="red" label="Deaths (24h / total)" value={`${hf.newDeaths24h.total} / ${hf.totalDeaths.total}`} />
            <Kpi variant="green" label="Recoveries (24h / total)" value={`${hf.newRecoveries24h.total} / ${hf.totalRecoveries.total}`} />
            <Kpi variant="red" label="Case fatality rate" value={pct(hf.caseFatalityRate)} />
          </div>

          <div className="charts-wide">
            <ChartCard title={`Epidemic trend (${periodLabel})`}>
              <Chart>
                <BarChart data={trendRows} margin={barMargin}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={legendStyle} />
                  <Bar dataKey="suspected" name="Suspected" fill={C.suspected} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="confirmed" name="Confirmed" fill={C.confirmed} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="deaths" name="Deaths" fill={C.deaths} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="recoveries" name="Recoveries" fill={C.recoveries} radius={[3, 3, 0, 0]} />
                </BarChart>
              </Chart>
            </ChartCard>

            <div className="stack">
              <ChartCard title="Suspected cases by sex">
                <Chart size="chart-h--sm">
                  <PieChart>
                    <Pie data={hfSexPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={legendStyle} />
                  </PieChart>
                </Chart>
              </ChartCard>
              <ChartCard title="Contacts: listed vs followed up">
                <div className="stat-tiles" style={{ padding: "10px 0" }}>
                  <div>
                    <div className="stat-tile__num stat-tile__num--blue">{fmt(hf.contactsListed.total)}</div>
                    <div className="stat-tile__label">Listed</div>
                  </div>
                  <div>
                    <div className="stat-tile__num stat-tile__num--green">{fmt(hf.contactsFollowedUp.total)}</div>
                    <div className="stat-tile__label">Followed up</div>
                  </div>
                </div>
              </ChartCard>
            </div>
          </div>
        </section>

        {/* ---------- Community Surveillance ---------- */}
        <section className="section">
          <SectionHead title="Community Surveillance" src="Source: eCHIS, M-Dharura · daily" />
          <div className="charts-wide">
            <ChartCard title="Signals generated vs verified (last 7 days)">
              <Chart>
                <BarChart data={commRows} margin={barMargin}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={legendStyle} />
                  <Bar dataKey="Signals" fill={C.signals} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Verified" fill={C.verified} radius={[3, 3, 0, 0]} />
                </BarChart>
              </Chart>
            </ChartCard>
            <div className="kpis" style={{ gridTemplateColumns: "1fr", alignContent: "start" }}>
              <Kpi label="Signals generated (CHPs)" value={fmt(comm.signalsGenerated)} />
              <Kpi variant="green" label="Verified signals linked (CHAs)" value={fmt(comm.verifiedSignalsLinked.total)} />
              <Kpi variant="blue" label="Contacts traced" value={fmt(comm.contactsTraced.total)} delta={splitText(comm.contactsTraced)} />
            </div>
          </div>
        </section>

        {/* ---------- Laboratory ---------- */}
        <section className="section">
          <SectionHead title="Laboratory" src="Source: Lab systems · daily" />
          <div className="kpis" style={{ marginBottom: 16 }}>
            <Kpi label="Tests done" value={fmt(labs.testsDone)} />
            <Kpi variant="red" label="Positive tests" value={fmt(labs.positiveTests)} />
            <Kpi variant="green" label="Negative tests" value={fmt(labs.negativeTests)} />
            <Kpi variant="amber" label="Turnaround time (TAT)" value={`${labs.turnaroundTimeHrs} hrs`} />
          </div>
          <div className="charts-wide">
            <ChartCard title="Daily lab results (last 7 days)">
              <Chart>
                <BarChart data={labRows} margin={barMargin}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={legendStyle} />
                  <Bar dataKey="Negative" fill={C.negative} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Positive" fill={C.positive} radius={[3, 3, 0, 0]} />
                </BarChart>
              </Chart>
            </ChartCard>
            <ChartCard title="Test results breakdown">
              <Chart>
                <PieChart>
                  <Pie data={labResultPie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={legendStyle} />
                </PieChart>
              </Chart>
            </ChartCard>
          </div>
        </section>

        {/* ---------- County breakdown ---------- */}
        <section className="section">
          <SectionHead title="County Breakdown" src="Confirmed, deaths and recoveries by county" />
          <div className="charts-wide">
            <ChartCard title="By county">
              <Chart>
                <BarChart data={countyRows} margin={barMargin}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...axisProps} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={legendStyle} />
                  <Bar dataKey="Confirmed" fill={C.confirmed} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Deaths" fill={C.deaths} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Recoveries" fill={C.recoveries} radius={[3, 3, 0, 0]} />
                </BarChart>
              </Chart>
            </ChartCard>
            <ChartCard title="County table">
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>County</th>
                      <th className="num">Conf.</th>
                      <th className="num">Adm.</th>
                      <th className="num">Died</th>
                      <th className="num">Rec.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.counties.map((c) => (
                      <tr key={c.county}>
                        <td>{c.county}</td>
                        <td className="num">{fmt(c.confirmed)}</td>
                        <td className="num">{fmt(c.admitted)}</td>
                        <td className="num">{fmt(c.deaths)}</td>
                        <td className="num">{fmt(c.recoveries)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        </section>

        <footer className="footer">
          Data sources: ADaM (Ebola CIF) / MOH 502, TC EMRs, Contacts Listing Form, eCHIS, M-Dharura,
          Lab systems, Civil Registries (D1). Awaiting connection to a live data source.
        </footer>
      </div>
    </>
  );
}
