"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fmt } from "@/lib/format";
import { INDICATOR_TOOLTIPS } from "@/lib/indicator-tooltips";

function MetricIcon({ name }) {
  const paths = {
    confirmed: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 2v3.2M12 18.8V22M2 12h3.2M18.8 12H22M4.9 4.9l2.3 2.3M16.8 16.8l2.3 2.3M19.1 4.9l-2.3 2.3M7.2 16.8l-2.3 2.3" />
      </svg>
    ),
    admissions: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M3 14h18v5H3z" />
        <path d="M5 14V9a2 2 0 0 1 2-2h3v7M14 7h3a2 2 0 0 1 2 2v5" />
        <path d="M9 11h2" />
      </svg>
    ),
    recoveries: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M6.5 20c.8-3 2.4-4.8 5.5-4.8s4.7 1.8 5.5 4.8" />
        <path d="M16.5 11.5l1.8 1.8 3.2-3.2" />
      </svg>
    ),
    deaths: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M8 4h8l-1 16H9L8 4z" />
        <path d="M10 4V2h4v2" />
        <path d="M9 10h6M9 14h6" />
      </svg>
    ),
    tests: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M10 2h4" />
        <path d="M11 2v6l-5 9a3 3 0 0 0 2.6 4.5h6.8A3 3 0 0 0 18 17l-5-9V2" />
        <path d="M8 16h8" />
      </svg>
    ),
    screening: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 5h16v14H4z" />
        <path d="M8 9h8M8 13h5" />
        <path d="M17 13l1.4 1.4L21 11.8" />
      </svg>
    ),
  };

  return paths[name] || null;
}

function DeltaPill({ value }) {
  if (!Number.isFinite(value)) return null;
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const magnitude = Math.abs(value);
  return (
    <span className="public-key-card__delta" aria-label={`Change in the last 24 hours: ${sign}${magnitude}`}>
      Last 24h <strong>{sign}{fmt(magnitude)}</strong>
    </span>
  );
}

function IndicatorBubble({ text }) {
  return text ? <span className="indicator-tooltip__bubble" role="tooltip">{text}</span> : null;
}

function tooltipAttrs(description, label) {
  if (!description) return {};
  return {
    tabIndex: 0,
    title: description,
    "aria-label": `${label}: ${description}`,
  };
}

function KeyCard({ tone, icon, value, label, delta, description, children }) {
  return (
    <article
      className={`public-key-card public-key-card--${tone} indicator-tooltip-host`}
      {...tooltipAttrs(description, label)}
    >
      <header className="public-key-card__head">
        <div className="public-key-card__icon" aria-hidden="true">
          <MetricIcon name={icon} />
        </div>
        <DeltaPill value={delta} />
      </header>
      <div className="public-key-card__main">
        <strong>{fmt(value)}</strong>
        <span>{label}</span>
      </div>
      {children}
      <IndicatorBubble text={description} />
    </article>
  );
}

function PublicKeyMetrics({ data }) {
  const cases = data?.cases || {};
  const poe = data?.poe || {};

  return (
    <div className="public-key-grid">
      <article
        className="public-key-card public-key-card--featured public-key-card--admissions indicator-tooltip-host"
        {...tooltipAttrs(INDICATOR_TOOLTIPS.confirmedCases, "Confirmed cases")}
      >
        <header className="public-key-card__head">
          <div className="public-key-card__icon" aria-hidden="true">
            <MetricIcon name="confirmed" />
          </div>
          <DeltaPill value={cases.newConfirmed24h} />
        </header>
        <div className="public-key-card__main">
          <strong>{fmt(cases.confirmed)}</strong>
          <span>Confirmed cases</span>
        </div>
        <IndicatorBubble text={INDICATOR_TOOLTIPS.confirmedCases} />
      </article>

      <KeyCard
        tone="confirmed"
        icon="screening"
        value={poe.totalScreened}
        label="Total Screened"
        delta={poe.newScreened24h}
        description={INDICATOR_TOOLTIPS.screeningRecords}
      />
      <KeyCard
        tone="recoveries"
        icon="recoveries"
        value={cases.recoveries}
        label="Recoveries"
        delta={cases.newRecoveries24h}
        description={INDICATOR_TOOLTIPS.recoveries}
      />
      <KeyCard
        tone="deaths"
        icon="deaths"
        //value={cases.deaths}
        value={0}
        label="Deaths"
        delta={cases.newDeaths24h}
        description={INDICATOR_TOOLTIPS.deaths}
      />
    </div>
  );
}

function PanelStats({ items }) {
  return (
    <dl className="public-panel__stats">
      {items.map((item) => (
        <div
          key={item.label}
          className="public-panel-stat indicator-tooltip-host"
          {...tooltipAttrs(item.description, item.label)}
        >
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
          {item.hint ? <p>{item.hint}</p> : null}
          <IndicatorBubble text={item.description} />
        </div>
      ))}
    </dl>
  );
}

function PublicTestFigures({ data }) {
  if (!data) {
    return <div className="public-loading public-loading--inline">Loading tab details...</div>;
  }

  const labs = data.labs || {};

  return (
    <div className="public-panel">
      <PanelStats
        items={[
          { label: "Total tested", value: fmt(labs.testsDone), description: INDICATOR_TOOLTIPS.testsDone },
          { label: "Last 24h tested", value: fmt(labs.newTested24h), description: INDICATOR_TOOLTIPS.latestTests },
          { label: "Positive tests", value: fmt(labs.positive), description: INDICATOR_TOOLTIPS.positiveTests },
        ]}
      />
    </div>
  );
}

export default function PublicLanding() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [refreshing, setRefreshing] = useState(false);
  const reqId = useRef(0);

  const load = useCallback((background = false) => {
    const id = ++reqId.current;
    if (background) setRefreshing(true);
    else setStatus("loading");
    fetch("/api/analytics/metrics", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
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

  useEffect(() => {
    load();
  }, [load]);

  const updated = useMemo(() => {
    if (!data?.meta?.lastUpdated) return null;
    return new Date(data.meta.lastUpdated).toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [data?.meta?.lastUpdated]);

  return (
    <main className="public-page">
      <section className="public-hero">
        <div className="public-hero__copy">
          <div>
            <p className="public-label">Kenya Ebola surveillance</p>
            <h1 className="public-hero__title">Current Ebola situation update</h1>
            <p className="public-hero__meta" aria-live="polite">
              {status === "error"
                ? "Unable to load the current update."
                : updated
                  ? `Last updated ${updated}.`
                  : "Loading current figures..."}
            </p>
          </div>
          <div className="hero-tile__actions">
            <button
              className="btn btn--secondary"
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      <section className="public-key-metrics" aria-label="Key public metrics">
        <div className="public-section-head">
          <h2>Key metrics</h2>
          <p>Headline confirmed cases, recoveries, deaths, and total screened from the current national update.</p>
        </div>
        {status === "ready" ? (
          <PublicKeyMetrics data={data} />
        ) : (
          <div className="public-loading public-loading--block">
            {status === "error" ? "Metrics unavailable" : "Loading metrics..."}
          </div>
        )}
      </section>

      <section className="public-tabs-section" aria-label="Testing figures">
        <div className="public-section-head">
          <h2>Detailed figures</h2>
          <p>Supporting laboratory testing indicators.</p>
        </div>
        {status === "ready" ? (
          <PublicTestFigures data={data} />
        ) : (
          <div className="public-loading public-loading--inline">
            {status === "error" ? "Sections unavailable" : "Loading sections..."}
          </div>
        )}
      </section>

      <section className="public-info" aria-label="Public guidance">
        <div className="public-info__col">
          <h2>What to do</h2>
          <ul>
            <li>Report symptoms early — fever, unusual bleeding, or sudden illness.</li>
            <li>Follow official MoH guidance.</li>
            <li>Avoid direct contact with body fluids from anyone who is unwell.</li>
          </ul>
        </div>
        <div className="public-info__col">
          <h2>Help channels</h2>
          <ul>
            <li>Dial <strong>719</strong> for free health support.</li>
            <li>Use official MoH and DHA channels for verified updates.</li>
          </ul>
        </div>
        <div className="public-info__col">
          <h2>Data safety</h2>
          <p>This page shows aggregate indicators only. Operational records remain restricted.</p>
        </div>
      </section>
    </main>
  );
}
