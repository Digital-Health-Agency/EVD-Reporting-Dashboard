"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import "./registerCharts";
import { Bar } from "react-chartjs-2";
import { fmt, pct, splitText } from "@/lib/format";

function Row({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function Dashboard({ data }) {
  const [period, setPeriod] = useState("7d");

  const s = data.summary;
  const hf = data.healthFacilities;
  const comm = data.community;
  const poe = data.pointsOfEntry;
  const labs = data.labs;

  const dateLabel = useMemo(() => {
    const d = new Date(data.meta.lastUpdated);
    return d.toLocaleDateString("en-KE", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  }, [data.meta.lastUpdated]);

  const baseOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } };
  const axisOpts = { ...baseOpts, scales: { y: { beginAtZero: true } } };

  const trendData = useMemo(() => {
    const keys = ["suspected", "confirmed", "deaths", "recoveries"];
    let series = Object.fromEntries(keys.map((k) => [k, data.trend.map((r) => r[k])]));
    let labels = data.trend.map((r) =>
      new Date(r.date).toLocaleDateString("en-KE", { month: "short", day: "numeric" })
    );
    if (period === "cumulative") {
      const cum = (arr) => { let r = 0; return arr.map((v) => (r += v)); };
      keys.forEach((k) => (series[k] = cum(series[k])));
    } else if (period === "24h") {
      labels = labels.slice(-1);
      keys.forEach((k) => (series[k] = series[k].slice(-1)));
    }
    return {
      labels,
      datasets: [
        { label: "Suspected", data: series.suspected, backgroundColor: "#1f6feb" },
        { label: "Confirmed", data: series.confirmed, backgroundColor: "#0e6e63" },
        { label: "Deaths", data: series.deaths, backgroundColor: "#c0392b" },
        { label: "Recoveries", data: series.recoveries, backgroundColor: "#1f9254" },
      ],
    };
  }, [data.trend, period]);

  const countyChartData = {
    labels: data.counties.map((c) => c.county),
    datasets: [
      { label: "Confirmed", data: data.counties.map((c) => c.confirmed), backgroundColor: "#0e6e63" },
      { label: "Deaths", data: data.counties.map((c) => c.deaths), backgroundColor: "#c0392b" },
      { label: "Recoveries", data: data.counties.map((c) => c.recoveries), backgroundColor: "#1f9254" },
    ],
  };

  return (
    <>
      {/* App bar with both logos */}
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
              Situation overview across points of entry, health facilities, community and laboratory
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
          <div className="kpi">
            <div className="kpi__label">Confirmed cases</div>
            <div className="kpi__value">{fmt(s.confirmedCasesTotal.total)}</div>
            <div className="kpi__delta"><b>+{s.newConfirmed24h.total}</b> in last 24h · {splitText(s.confirmedCasesTotal)}</div>
          </div>
          <div className="kpi kpi--amber">
            <div className="kpi__label">Currently admitted</div>
            <div className="kpi__value">{fmt(s.currentlyAdmitted.total)}</div>
            <div className="kpi__delta">{splitText(s.currentlyAdmitted)}</div>
          </div>
          <div className="kpi kpi--red">
            <div className="kpi__label">Deaths</div>
            <div className="kpi__value">{fmt(s.totalDeaths.total)}</div>
            <div className="kpi__delta">CFR <b>{pct(s.caseFatalityRate)}</b> · <b>+{s.newDeaths24h.total}</b> in 24h</div>
          </div>
          <div className="kpi kpi--green">
            <div className="kpi__label">Recoveries</div>
            <div className="kpi__value">{fmt(s.totalRecoveries.total)}</div>
            <div className="kpi__delta"><b>+{s.newRecoveries24h.total}</b> in last 24h</div>
          </div>
        </section>

        {/* Trend + snapshot */}
        <section className="section">
          <div className="split">
            <div className="card">
              <div className="card__head">
                <h2 className="card__title">Epidemic trend</h2>
              </div>
              <div className="chart-box"><Bar data={trendData} options={axisOpts} /></div>
            </div>
            <div className="card">
              <h2 className="card__title">National snapshot</h2>
              <div className="rows" style={{ marginTop: 8 }}>
                <Row label="Suspected cases" value={fmt(s.suspectedCases.total)} />
                <Row label="New confirmed (24h)" value={fmt(s.newConfirmed24h.total)} />
                <Row label="Currently admitted" value={fmt(s.currentlyAdmitted.total)} />
                <Row label="Travellers screened (POE)" value={fmt(poe.screened)} />
                <Row label="Tests done" value={fmt(labs.testsDone)} />
                <Row label="Positive tests" value={fmt(labs.positiveTests)} />
                <Row label="Lab turnaround time (TAT)" value={`${labs.turnaroundTimeHrs} hrs`} />
              </div>
            </div>
          </div>
        </section>

        {/* County breakdown */}
        <section className="section">
          <h3 className="section__title">County breakdown</h3>
          <div className="split">
            <div className="card">
              <h2 className="card__title">Confirmed, deaths &amp; recoveries by county</h2>
              <div className="chart-box" style={{ marginTop: 12 }}><Bar data={countyChartData} options={axisOpts} /></div>
            </div>
            <div className="card">
              <h2 className="card__title">By county</h2>
              <div className="table-wrap" style={{ marginTop: 8 }}>
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
            </div>
          </div>
        </section>

        {/* Operational pillars */}
        <section className="section">
          <h3 className="section__title">Response pillars</h3>
          <div className="pillars">
            <div className="card">
              <span className="pillar__tag">Points of entry</span>
              <div className="rows" style={{ marginTop: 12 }}>
                <Row label="Travellers screened" value={fmt(poe.screened)} />
                <Row label="Suspected identified" value={fmt(poe.suspectedCases)} />
                <Row label="Contacts listed" value={fmt(poe.contactsListed.total)} />
              </div>
            </div>

            <div className="card">
              <span className="pillar__tag">Contact tracing</span>
              <div className="rows" style={{ marginTop: 12 }}>
                <Row label="Contacts listed" value={`${fmt(hf.contactsListed.total)} · ${splitText(hf.contactsListed)}`} />
                <Row label="Contacts followed up" value={`${fmt(hf.contactsFollowedUp.total)} · ${splitText(hf.contactsFollowedUp)}`} />
              </div>
            </div>

            <div className="card">
              <span className="pillar__tag">Community surveillance</span>
              <div className="rows" style={{ marginTop: 12 }}>
                <Row label="Signals generated (CHPs)" value={fmt(comm.signalsGenerated)} />
                <Row label="Verified &amp; linked" value={fmt(comm.verifiedSignalsLinked.total)} />
                <Row label="Contacts traced" value={fmt(comm.contactsTraced.total)} />
              </div>
            </div>

            <div className="card">
              <span className="pillar__tag">Laboratory</span>
              <div className="rows" style={{ marginTop: 12 }}>
                <Row label="Tests done" value={fmt(labs.testsDone)} />
                <Row label="Positive tests" value={fmt(labs.positiveTests)} />
                <Row label="Negative tests" value={fmt(labs.negativeTests)} />
                <Row label="Turnaround time (TAT)" value={`${labs.turnaroundTimeHrs} hrs`} />
              </div>
            </div>
          </div>
        </section>

        <footer className="footer">
          Data sources: ADaM (Ebola CIF) / MOH 502, TC EMRs, Contacts Listing Form, eCHIS, M-Dharura,
          Lab systems, Civil Registries (D1). Figures shown are illustrative sample data for layout purposes.
        </footer>
      </div>
    </>
  );
}
