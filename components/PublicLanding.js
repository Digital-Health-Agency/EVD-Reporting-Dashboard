"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fmt } from "@/lib/format";
import { INDICATOR_TOOLTIPS } from "@/lib/indicator-tooltips";

const PUBLIC_TABS = [
  { key: "highlights", label: "Highlights" },
  { key: "cases", label: "Cases" },
  { key: "tests", label: "Tests" },
  { key: "contacts", label: "Contacts" },
  { key: "alerts", label: "Alerts" },
  { key: "poe", label: "Points of entry" },
];

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
  const labs = data?.labs || {};
  const poe = data?.poe || {};

  return (
    <div className="public-key-grid">
      <article
        className="public-key-card public-key-card--featured public-key-card--confirmed indicator-tooltip-host"
        {...tooltipAttrs(INDICATOR_TOOLTIPS.totalCases, "Total flagged")}
      >
        <header className="public-key-card__head">
          <div className="public-key-card__icon" aria-hidden="true">
            <MetricIcon name="confirmed" />
          </div>
          <DeltaPill value={cases.newCases24h ?? cases.latestCases} />
        </header>
        <div className="public-key-card__main">
          <strong>{fmt(cases.totalCases)}</strong>
          <span>Total flagged</span>
        </div>
        <div className="public-key-card__breakdown">
          <div>
            <strong>{fmt(cases.suspected)}</strong>
            <span>Alerts</span>
          </div>
          <div>
            <strong>{fmt(cases.confirmed)}</strong>
            <span>Confirmed</span>
          </div>
        </div>
        <IndicatorBubble text={INDICATOR_TOOLTIPS.totalCases} />
      </article>

      <KeyCard
        tone="admissions"
        icon="confirmed"
        value={cases.confirmed}
        label="Confirmed cases"
        delta={cases.newConfirmed24h}
        description={INDICATOR_TOOLTIPS.confirmedCases}
      />
      <KeyCard
        tone="recoveries"
        icon="tests"
        value={labs.testsDone}
        label="Tests done"
        delta={labs.newTested24h}
        description={INDICATOR_TOOLTIPS.testsDone}
      />
      <KeyCard
        tone="deaths"
        icon="screening"
        value={poe.totalScreened}
        label="Screening records"
        delta={poe.newScreened24h ?? poe.latestScreened}
        description={INDICATOR_TOOLTIPS.screeningRecords}
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

function PanelSection({ title, children }) {
  return (
    <div className="public-panel-section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function ShareBar({ segments }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div className="public-share">
      <div className="public-share__bar" role="img" aria-label={segments.map((s) => `${s.label}: ${fmt(s.value)}`).join(", ")}>
        {total > 0 ? segments.map((segment) => (
          <span
            key={segment.label}
            className={`public-share__seg public-share__seg--${segment.tone}`}
            style={{ width: `${(segment.value / total) * 100}%` }}
          />
        )) : <span className="public-share__seg public-share__seg--empty" style={{ width: "100%" }} />}
      </div>
      <ul className="public-share__legend">
        {segments.map((segment) => (
          <li key={segment.label}>
            <span className={`public-share__dot public-share__dot--${segment.tone}`} aria-hidden="true" />
            {segment.label}
            <strong>{fmt(segment.value)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProgressMeter({ value, total, caption }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;

  return (
    <div className="public-meter">
      <div className="public-meter__row">
        <strong>{pct.toFixed(0)}%</strong>
        <span>{caption}</span>
      </div>
      <div className="public-meter__track" role="img" aria-label={`${pct.toFixed(0)}% ${caption}`}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RankList({ rows }) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <ul className="public-rank">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="public-rank__row">
            <span>{row.label}</span>
            <strong>{fmt(row.value)}</strong>
          </div>
          <div className="public-rank__track" aria-hidden="true">
            <span style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function PublicTabPanel({ activeTab, data }) {
  if (!data) {
    return <div className="public-loading public-loading--inline">Loading tab details...</div>;
  }

  const cases = data.cases || {};
  const labs = data.labs || {};
  const poe = data.poe || {};
  const topPoe = [...(poe.byPoe || [])]
    .sort((a, b) => (b.screened || 0) - (a.screened || 0))
    .slice(0, 5);

  if (activeTab === "highlights") {
    return (
      <div className="public-panel">
        <PanelStats
          items={[
            { label: "Last 24h flagged", value: fmt(cases.newCases24h ?? cases.latestCases), description: INDICATOR_TOOLTIPS.latestCases },
            { label: "Alerts", value: fmt(cases.suspected), description: INDICATOR_TOOLTIPS.suspectedCases },
            { label: "Tests done", value: fmt(labs.testsDone), description: INDICATOR_TOOLTIPS.testsDone },
            { label: "Screening records", value: fmt(poe.totalScreened), description: INDICATOR_TOOLTIPS.screeningRecords },
          ]}
        />
        <div className="public-panel__sections">
          <PanelSection title="Testing">
            <ProgressMeter
              value={labs.positive || 0}
              total={labs.testsDone || 0}
              caption="of tests came back positive"
            />
          </PanelSection>
          <PanelSection title="Contact tracing">
            <ProgressMeter
              value={cases.contactsFollowedUp || 0}
              total={cases.contactsListed || 0}
              caption="of listed contacts reached by health teams"
            />
          </PanelSection>
        </div>
      </div>
    );
  }

  if (activeTab === "cases") {
    return (
      <div className="public-panel">
        <PanelStats
          items={[
            { label: "Total flagged", value: fmt(cases.totalCases), description: INDICATOR_TOOLTIPS.totalCases },
            { label: "Alerts", value: fmt(cases.suspected), description: INDICATOR_TOOLTIPS.suspectedCases },
            { label: "Confirmed", value: fmt(cases.confirmed), description: INDICATOR_TOOLTIPS.confirmedCases },
            { label: "Probable", value: fmt(cases.probable), description: INDICATOR_TOOLTIPS.probableCases },
          ]}
        />
        <div className="public-panel__sections">
          <PanelSection title="Where confirmed cases came from">
            <ShareBar
              segments={[
                { label: "Imported", value: cases.importedCases || 0, tone: "blue" },
                { label: "Local", value: cases.localCases || 0, tone: "amber" },
              ]}
            />
          </PanelSection>
          <PanelSection title="Outcomes">
            <ShareBar
              segments={[
                { label: "Recovered", value: cases.recoveries || 0, tone: "green" },
                { label: "In care", value: cases.admitted || 0, tone: "blue" },
                { label: "Died", value: cases.deaths || 0, tone: "red" },
              ]}
            />
          </PanelSection>
        </div>
      </div>
    );
  }

  if (activeTab === "tests") {
    return (
      <div className="public-panel">
        <PanelStats
          items={[
            { label: "Total tested", value: fmt(labs.testsDone), description: INDICATOR_TOOLTIPS.testsDone },
            { label: "Last 24h tested", value: fmt(labs.newTested24h), description: INDICATOR_TOOLTIPS.latestTests },
            { label: "Positive tests", value: fmt(labs.positive), description: INDICATOR_TOOLTIPS.positiveTests },
            { label: "Inconclusive", value: fmt(labs.inconclusive), description: INDICATOR_TOOLTIPS.inconclusiveTests },
          ]}
        />
        <div className="public-panel__sections">
          <PanelSection title="Results">
            <ShareBar
              segments={[
                { label: "Negative", value: labs.negative || 0, tone: "green" },
                { label: "Positive", value: labs.positive || 0, tone: "red" },
                { label: "Inconclusive", value: labs.inconclusive || 0, tone: "amber" },
              ]}
            />
          </PanelSection>
          <PanelSection title="Positivity">
            <ProgressMeter
              value={labs.positive || 0}
              total={labs.testsDone || 0}
              caption="of all tests were positive"
            />
          </PanelSection>
        </div>
      </div>
    );
  }

  if (activeTab === "contacts") {
    return (
      <div className="public-panel">
        <PanelStats
          items={[
            { label: "Contacts listed", value: fmt(cases.contactsListed), description: INDICATOR_TOOLTIPS.contactsListed },
            { label: "Followed up", value: fmt(cases.contactsFollowedUp), description: INDICATOR_TOOLTIPS.contactsFollowedUp },
          ]}
        />
        <div className="public-panel__sections">
          <PanelSection title="Follow-up progress">
            <ProgressMeter
              value={cases.contactsFollowedUp || 0}
              total={cases.contactsListed || 0}
              caption="of listed contacts checked on by health teams"
            />
          </PanelSection>
          <PanelSection title="Why this matters">
            <p className="public-panel-note">
              Everyone who had close contact with a confirmed case is monitored
              for 21 days so any new illness is caught early.
            </p>
          </PanelSection>
        </div>
      </div>
    );
  }

  if (activeTab === "alerts") {
    return (
      <div className="public-panel">
        <PanelStats
          items={[
            { label: "Screening alerts", value: fmt(poe.alerts), description: INDICATOR_TOOLTIPS.poeAlerts },
            { label: "Alerts", value: fmt(cases.suspected), description: INDICATOR_TOOLTIPS.suspectedCases },
            { label: "Last 24h confirmed", value: fmt(cases.newConfirmed24h), description: INDICATOR_TOOLTIPS.confirmedCases },
          ]}
        />
        <div className="public-panel__sections">
          <PanelSection title="Report a concern">
            <p className="public-panel-note">
              If you or someone near you has fever, unusual bleeding, or has had
              contact with a sick traveller, call <strong>147</strong> free of
              charge. Alerts here are aggregate signals from screening and
              surveillance summaries.
            </p>
          </PanelSection>
        </div>
      </div>
    );
  }

  return (
    <div className="public-panel">
      <PanelStats
        items={[
          { label: "Screening records", value: fmt(poe.totalScreened), description: INDICATOR_TOOLTIPS.screeningRecords },
          { label: "Unique travellers", value: fmt(poe.uniqueTravelers), description: INDICATOR_TOOLTIPS.uniqueTravelers },
          { label: "Screening alerts", value: fmt(poe.alerts), description: INDICATOR_TOOLTIPS.poeAlerts },
        ]}
      />
      <div className="public-panel__sections">
        <PanelSection title="Busiest screening points">
          <RankList
            rows={topPoe.map((row) => ({ label: row.name, value: row.screened || 0 }))}
          />
        </PanelSection>
      </div>
    </div>
  );
}

export default function PublicLanding() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(PUBLIC_TABS[0].key);
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
          <p>Headline confirmed cases, admissions, recoveries, and deaths from the current national update.</p>
        </div>
        {status === "ready" ? (
          <PublicKeyMetrics data={data} />
        ) : (
          <div className="public-loading public-loading--block">
            {status === "error" ? "Metrics unavailable" : "Loading metrics..."}
          </div>
        )}
      </section>

      <section className="public-tabs-section" aria-label="Public update sections">
        <div className="public-section-head">
          <h2>Detailed figures</h2>
          <p>Supporting indicators grouped by cases, testing, contacts, alerts, and points of entry.</p>
        </div>
        <nav className="public-nav" aria-label="Ebola update sections">
          <div className="tabs public-view-tabs" role="tablist" aria-label="Ebola update sections">
            {PUBLIC_TABS.map((tab) => (
              <button
                key={tab.key}
                id={`public-tab-${tab.key}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls={`public-panel-${tab.key}`}
                className={`tab ${activeTab === tab.key ? "tab--active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
        <div
          id={`public-panel-${activeTab}`}
          className="public-tab-content"
          role="tabpanel"
          aria-labelledby={`public-tab-${activeTab}`}
        >
          {status === "ready" ? (
            <PublicTabPanel activeTab={activeTab} data={data} />
          ) : (
            <div className="public-loading public-loading--inline">
              {status === "error" ? "Sections unavailable" : "Loading sections..."}
            </div>
          )}
        </div>
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
            <li>Dial <strong>147</strong> for free health support.</li>
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
