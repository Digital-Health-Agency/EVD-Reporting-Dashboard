"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fmt } from "@/lib/format";

function PublicMetric({ label, value, tone = "blue" }) {
  return (
    <div className={`public-metric public-metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const PUBLIC_TABS = [
  "Highlights",
  "Cases",
  "Tests",
  "Contacts",
  "Alerts",
  "Points of entry",
];

function PublicTabPanel({ activeTab, data, updated }) {
  if (!data) {
    return <div className="public-loading">Loading tab details...</div>;
  }

  const cases = data.cases || {};
  const labs = data.labs || {};
  const poe = data.poe || {};
  const contactsCompleted = Math.max(0, (cases.contactsFollowedUp || 0) - (cases.admitted || 0));
  const topPoe = [...(poe.byPoe || [])]
    .sort((a, b) => (b.screened || 0) - (a.screened || 0))
    .slice(0, 4);

  if (activeTab === "Highlights") {
    return (
      <div className="public-tab-panel public-tab-panel--split">
        <div>
          <h3>Latest public update</h3>
          <p>Active national surveillance is ongoing. This page shows public aggregate indicators only.</p>
        </div>
        <dl className="public-tab-list">
          <div><dt>Last updated</dt><dd>{updated || "Loading"}</dd></div>
          <div><dt>Data source</dt><dd>{data.meta?.provenance?.labs?.source === "mock" ? "Mock API preview" : "Dashboard API"}</dd></div>
          <div><dt>Public advice</dt><dd>Report symptoms early and use official help channels.</dd></div>
        </dl>
      </div>
    );
  }

  if (activeTab === "Cases") {
    return (
      <div className="public-tab-panel">
        <div className="public-tab-metrics">
          <PublicMetric label="Confirmed" value={fmt(cases.confirmed)} tone="alert" />
          <PublicMetric label="Suspected" value={fmt(cases.suspected)} tone="amber" />
          <PublicMetric label="Recoveries" value={fmt(cases.recoveries)} tone="green" />
          <PublicMetric label="Deaths" value={fmt(cases.deaths)} tone="alert" />
          <PublicMetric label="Current admissions" value={fmt(cases.admitted)} tone="blue" />
        </div>
      </div>
    );
  }

  if (activeTab === "Tests") {
    return (
      <div className="public-tab-panel">
        <div className="public-tab-metrics">
          <PublicMetric label="Total tested" value={fmt(labs.testsDone)} tone="blue" />
          <PublicMetric label="Positive" value={fmt(labs.positive)} tone="alert" />
          <PublicMetric label="Negative" value={fmt(labs.negative)} tone="green" />
          <PublicMetric label="Pending" value={fmt(labs.pendingResults)} tone="amber" />
          <PublicMetric label="Positivity" value={`${Number(labs.positivityPct || 0).toFixed(1)}%`} tone="blue" />
        </div>
      </div>
    );
  }

  if (activeTab === "Contacts") {
    return (
      <div className="public-tab-panel">
        <div className="public-tab-metrics">
          <PublicMetric label="Contacts listed" value={fmt(cases.contactsListed)} tone="amber" />
          <PublicMetric label="Followed up" value={fmt(cases.contactsFollowedUp)} tone="green" />
          <PublicMetric label="Completed estimate" value={fmt(contactsCompleted)} tone="blue" />
        </div>
      </div>
    );
  }

  if (activeTab === "Alerts") {
    return (
      <div className="public-tab-panel public-tab-panel--split">
        <div>
          <h3>Public alerts</h3>
          <p>Alerts shown here are aggregate signals from public screening and surveillance summaries.</p>
        </div>
        <dl className="public-tab-list">
          <div><dt>POE alerts</dt><dd>{fmt(poe.alerts)}</dd></div>
          <div><dt>Suspected cases</dt><dd>{fmt(cases.suspected)}</dd></div>
          <div><dt>Help line</dt><dd>Dial 147</dd></div>
        </dl>
      </div>
    );
  }

  return (
    <div className="public-tab-panel public-tab-panel--split">
      <div>
        <h3>Points of entry</h3>
        <p>Traveller screening totals are shown as aggregate figures for public awareness.</p>
      </div>
      <dl className="public-tab-list">
        <div><dt>Travellers screened</dt><dd>{fmt(poe.totalScreened)}</dd></div>
        <div><dt>Unique travellers</dt><dd>{fmt(poe.uniqueTravelers)}</dd></div>
        <div><dt>Top reporting POE</dt><dd>{topPoe[0]?.name || "Loading"}</dd></div>
      </dl>
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

  const metrics = data ? [
    { label: "Confirmed cases", value: fmt(data.cases?.confirmed), tone: "alert" },
    { label: "Tests done", value: fmt(data.labs?.testsDone), tone: "blue" },
    { label: "POE screened", value: fmt(data.poe?.totalScreened), tone: "green" },
    { label: "Contacts listed", value: fmt(data.cases?.contactsListed), tone: "amber" },
    { label: "Recoveries", value: fmt(data.cases?.recoveries), tone: "green" },
    { label: "Current admissions", value: fmt(data.cases?.admitted), tone: "blue" },
  ] : [];

  return (
    <main className="public-page">
      <section className="public-hero">
        <div className="public-hero__copy">
          <p className="public-label">Kenya EVD/BVD surveillance</p>
          <h1>Current Ebola situation update</h1>
          <p aria-live="polite">
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
          <p>Public aggregate figures from the latest dashboard API update.</p>
        </div>
        <div className="public-band">
        {status === "ready" ? metrics.map((metric) => (
          <PublicMetric key={metric.label} {...metric} />
        )) : (
          <div className="public-loading">{status === "error" ? "Metrics unavailable" : "Loading metrics..."}</div>
        )}
        </div>
      </section>

      <section className="public-tabs-section" aria-label="Public update sections">
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
        {status === "ready" ? (
          <PublicTabPanel activeTab={activeTab} data={data} updated={updated} />
        ) : (
          <div className="public-loading">{status === "error" ? "Sections unavailable" : "Loading sections..."}</div>
        )}
      </section>

      <section className="public-grid">
        <article>
          <h2>What to do</h2>
          <p>Report symptoms early, follow MoH guidance, and avoid direct contact with body fluids from anyone who is unwell.</p>
        </article>
        <article>
          <h2>Help channels</h2>
          <p>Use Dial 147 for health support. Use official MoH and DHA channels for verified updates.</p>
        </article>
        <article>
          <h2>Data safety</h2>
          <p>This public page shows aggregate indicators only. Operational records remain restricted.</p>
        </article>
      </section>
    </main>
  );
}
