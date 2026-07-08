"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fmt } from "@/lib/format";

const PUBLIC_TABS = [
  "Highlights",
  "Cases",
  "Tests",
  "Contacts",
  "Alerts",
  "Points of entry",
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

function KeyCard({ tone, icon, value, label, delta, children }) {
  return (
    <article className={`public-key-card public-key-card--${tone}`}>
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
    </article>
  );
}

function PublicKeyMetrics({ cases }) {
  const confirmed = cases?.confirmed ?? 0;
  const imported = cases?.importedCases;
  const local = cases?.localCases;
  const showBreakdown = Number.isFinite(imported) && Number.isFinite(local);

  return (
    <div className="public-key-grid">
      <article className="public-key-card public-key-card--featured public-key-card--confirmed">
        <header className="public-key-card__head">
          <div className="public-key-card__icon" aria-hidden="true">
            <MetricIcon name="confirmed" />
          </div>
          <DeltaPill value={cases?.newConfirmed24h} />
        </header>
        <div className="public-key-card__main">
          <strong>{fmt(confirmed)}</strong>
          <span>Cumulative confirmed cases</span>
        </div>
        {showBreakdown ? (
          <div className="public-key-card__breakdown">
            <div>
              <strong>{fmt(imported)}</strong>
              <span>Imported</span>
            </div>
            <div>
              <strong>{fmt(local)}</strong>
              <span>Local</span>
            </div>
          </div>
        ) : null}
      </article>

      <KeyCard
        tone="admissions"
        icon="admissions"
        value={cases?.admitted}
        label="Current admissions"
        delta={cases?.newAdmissions24h}
      />
      <KeyCard
        tone="recoveries"
        icon="recoveries"
        value={cases?.recoveries}
        label="Recoveries"
        delta={cases?.newRecoveries24h}
      />
      <KeyCard
        tone="deaths"
        icon="deaths"
        value={cases?.deaths}
        label="Cumulative deaths"
        delta={cases?.newDeaths24h}
      />
    </div>
  );
}

function PanelStats({ items }) {
  return (
    <dl className="public-panel__stats">
      {items.map((item) => (
        <div key={item.label} className="public-panel-stat">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
          {item.hint ? <p>{item.hint}</p> : null}
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

  if (activeTab === "Highlights") {
    return (
      <div className="public-panel">
        <PanelStats
          items={[
            { label: "New confirmed (24h)", value: fmt(cases.newConfirmed24h) },
            { label: "Suspected cases", value: fmt(cases.suspected) },
            { label: "Tests done", value: fmt(labs.testsDone) },
            { label: "Travellers screened", value: fmt(poe.totalScreened) },
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

  if (activeTab === "Cases") {
    return (
      <div className="public-panel">
        <PanelStats
          items={[
            { label: "Total cases", value: fmt(cases.totalCases) },
            { label: "Suspected", value: fmt(cases.suspected) },
            { label: "Probable", value: fmt(cases.probable) },
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

  if (activeTab === "Tests") {
    return (
      <div className="public-panel">
        <PanelStats
          items={[
            { label: "Total tested", value: fmt(labs.testsDone) },
            { label: "Tested in last 24h", value: fmt(labs.newTested24h) },
            { label: "Awaiting results", value: fmt(labs.pendingResults) },
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

  if (activeTab === "Contacts") {
    return (
      <div className="public-panel">
        <PanelStats
          items={[
            { label: "Contacts listed", value: fmt(cases.contactsListed) },
            { label: "Followed up", value: fmt(cases.contactsFollowedUp) },
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

  if (activeTab === "Alerts") {
    return (
      <div className="public-panel">
        <PanelStats
          items={[
            { label: "Screening alerts", value: fmt(poe.alerts) },
            { label: "Suspected cases", value: fmt(cases.suspected) },
            { label: "New confirmed (24h)", value: fmt(cases.newConfirmed24h) },
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
          { label: "Travellers screened", value: fmt(poe.totalScreened) },
          { label: "Unique travellers", value: fmt(poe.uniqueTravelers) },
          { label: "Screening alerts", value: fmt(poe.alerts) },
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
  const [activeTab, setActiveTab] = useState(PUBLIC_TABS[0]);

  const load = useCallback(() => {
    setStatus("loading");
    fetch("/api/metrics/ebola", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        setData(payload);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
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
          <p className="public-label">Kenya EVD/BVD surveillance</p>
          <h1 className="public-hero__title">Current Ebola situation update</h1>
          <p className="public-hero__meta" aria-live="polite">
            {status === "error"
              ? "Unable to load the latest update."
              : updated
                ? `Last updated ${updated}.`
                : "Loading latest figures..."}
          </p>
          {status === "error" ? (
            <div className="public-actions">
              <button className="btn btn--secondary" type="button" onClick={load}>Retry</button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="public-key-metrics" aria-label="Key public metrics">
        <div className="public-section-head">
          <h2>Key metrics</h2>
          <p>Headline confirmed cases, admissions, recoveries, and deaths from the latest national update.</p>
        </div>
        {status === "ready" ? (
          <PublicKeyMetrics cases={data.cases} />
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
        <div className="public-tabs" role="tablist" aria-label="Ebola update sections">
          {PUBLIC_TABS.map((tab) => (
            <button
              key={tab}
              className={`public-tab ${activeTab === tab ? "is-active" : ""}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="public-tab-content">
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
