"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Dashboard from "@/components/Dashboard";
import PoeBubbleMap, { POE_COUNT } from "@/components/PoeBubbleMap";
import { DEFAULT_DISEASE } from "@/lib/diseases";
import { fmt } from "@/lib/format";

const POLL_MS = 60_000;
const EXECUTIVE_TABS = [
  { key: "dashboard", label: "Dashboard", title: "Executive situation brief" },
  { key: "poe", label: "POE", title: "Point-of-entry screening map and details" },
];

const ratioPct = (value, total) => (total > 0 ? Math.min(100, (value / total) * 100) : 0);

function PoeInfoMetric({ tone = "blue", label, value, hint }) {
  return (
    <article className="brief-metric brief-metric--plain">
      <span className="brief-metric__label">{label}</span>
      <strong className={`brief-metric__value is-${tone}`}>{value}</strong>
      {hint ? <span className="brief-metric__detail">{hint}</span> : null}
    </article>
  );
}

function PoeExecutiveView({ data }) {
  const poe = data.poe || {};
  const byPoe = poe.byPoe || [];
  const prov = data.meta.provenance || {};

  const rankedPoes = useMemo(
    () =>
      [...byPoe]
        .filter((row) => !row.unknown)
        .sort((a, b) => (b.screened || 0) - (a.screened || 0)),
    [byPoe]
  );

  const totalScreened =
    poe.totalScreened || rankedPoes.reduce((sum, row) => sum + (row.screened || 0), 0);
  const uniqueTravelers =
    poe.uniqueTravelers || rankedPoes.reduce((sum, row) => sum + (row.uniqueTravelers || 0), 0);
  const alerts = poe.alerts || rankedPoes.reduce((sum, row) => sum + (row.alerts || 0), 0);
  const reportingPoes = rankedPoes.filter((row) => (row.screened || 0) > 0).length;
  const highestVolume = rankedPoes[0];
  const alertRate = ratioPct(alerts, totalScreened);
  const sourceLabel = prov.poe?.label || "marts.screenings_by_poe";

  return (
    <>
      <section className="brief-plain-grid poe-info-grid" aria-label="POE executive metrics">
        <PoeInfoMetric
          tone="green"
          label="Travellers screened"
          value={fmt(totalScreened)}
          hint="All reporting points of entry"
        />
        <PoeInfoMetric
          tone="blue"
          label="Unique travellers"
          value={fmt(uniqueTravelers)}
          hint="Deduplicated traveller count"
        />
        <PoeInfoMetric
          tone="amber"
          label="POE alerts"
          value={fmt(alerts)}
          hint={`${alertRate.toFixed(1)}% alert rate`}
        />
        <PoeInfoMetric
          tone="blue"
          label="Reporting POEs"
          value={`${reportingPoes}/${POE_COUNT}`}
          hint="Mapped POEs with screening data"
        />
        <PoeInfoMetric
          tone="green"
          label="Highest volume"
          value={highestVolume?.name || "--"}
          hint={highestVolume ? `${fmt(highestVolume.screened || 0)} screened` : "Awaiting POE rows"}
        />
        <PoeInfoMetric
          tone="blue"
          label="Source"
          value={prov.poe?.source === "live" ? "Live" : "Preview"}
          hint={sourceLabel}
        />
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Points of Entry - map and screening detail</h2>
          <p className="section__src">
            Bubble size and colour show traveller screening volume. Side cards keep the executive readout visible beside the map.
          </p>
        </div>

        <div className="poe-tab-layout">
          <div className="card poe-map-card">
            <PoeBubbleMap byPoe={byPoe} />
          </div>

          <div className="poe-side-stack">
            <article className="card">
              <div className="card__head card__head--stack">
                <h3 className="card__title">Top reporting points of entry</h3>
                <p className="card__summary">Highest screening volumes for briefing and resource prioritisation.</p>
              </div>
              {rankedPoes.length ? (
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
                      {rankedPoes.slice(0, 6).map((row) => (
                        <tr key={row.name}>
                          <td>{row.name}</td>
                          <td className="num">{fmt(row.screened || 0)}</td>
                          <td className="num">{fmt(row.alerts || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="data-empty">POE screening rows appear once the source mart is available.</div>
              )}
            </article>

            <article className="card">
              <div className="card__head card__head--stack">
                <h3 className="card__title">Executive readout</h3>
                <p className="card__summary">Fast context for senior review before drilling into operations.</p>
              </div>
              <ul className="mini-metric-list poe-readout-list">
                <li>
                  <span>Coverage</span>
                  <strong>{reportingPoes ? `${reportingPoes} POEs reporting` : "Awaiting reports"}</strong>
                </li>
                <li>
                  <span>Alert pressure</span>
                  <strong>{alerts ? `${fmt(alerts)} alerts from screening` : "No alerts reported"}</strong>
                </li>
                <li>
                  <span>Data source</span>
                  <strong>{sourceLabel}</strong>
                </li>
              </ul>
            </article>
          </div>
        </div>

        {poe.note ? <p className="section__src section__note">Note: {poe.note}</p> : null}
      </section>
    </>
  );
}

export default function DashboardShell() {
  const [view, setView] = useState("dashboard"); // dashboard | poe
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [refreshing, setRefreshing] = useState(false);
  const reqId = useRef(0);

  const load = useCallback((disease, background = false) => {
    const id = ++reqId.current;
    if (background) setRefreshing(true);
    else setStatus("loading");
    fetch(`/api/metrics/${disease}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((payload) => {
        if (id !== reqId.current) return;
        setData(payload);
        setStatus("ready");
      })
      .catch(() => {
        if (id !== reqId.current) return;
        if (!background) setStatus("error");
      })
      .finally(() => {
        if (id === reqId.current) setRefreshing(false);
      });
  }, []);

  // Load Ebola metrics, then poll.
  useEffect(() => {
    load(DEFAULT_DISEASE);
    const t = setInterval(() => load(DEFAULT_DISEASE, true), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const dateLabel = useMemo(() => {
    if (!data?.meta?.lastUpdated) return null;
    return new Date(data.meta.lastUpdated).toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [data?.meta?.lastUpdated]);

  return (
    <main className="container executive-page">
      <section className="executive-hero">
        <div>
          <span className="executive-kicker">Situation report dashboard</span>
          <h1>Executive Situation Brief</h1>
          <p>
            Leadership view of cases, testing, screening, contacts and response readiness for authorized stakeholders.
          </p>
        </div>
        <div className="executive-hero__actions">
          {dateLabel ? <span className="executive-hero__asof">As of {dateLabel}</span> : null}
          <button
            className="btn btn--secondary"
            type="button"
            onClick={() => load(DEFAULT_DISEASE, true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      <nav className="executive-nav" aria-label="Executive dashboard">
        <div className="tabs executive-view-tabs" role="tablist" aria-label="Executive dashboard views">
          {EXECUTIVE_TABS.map((tab) => (
            <button
              key={tab.key}
              id={`executive-tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={view === tab.key}
              aria-controls={`executive-panel-${tab.key}`}
              className={`tab ${view === tab.key ? "tab--active" : ""}`}
              onClick={() => setView(tab.key)}
              title={tab.title}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {status === "ready" && data ? (
        <section
          id={`executive-panel-${view}`}
          className="executive-tab-panel"
          role="tabpanel"
          aria-labelledby={`executive-tab-${view}`}
        >
          {view === "poe" ? (
            <PoeExecutiveView data={data} />
          ) : (
            <Dashboard data={data} />
          )}
        </section>
      ) : status === "error" ? (
        <div className="state">Could not load metrics. Is the warehouse running?</div>
      ) : (
        <div className="state">Loading Ebola metrics...</div>
      )}
    </main>
  );
}
