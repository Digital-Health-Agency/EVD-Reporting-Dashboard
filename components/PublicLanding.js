"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fmt } from "@/lib/format";

function PublicMetric({ label, value, tone = "blue" }) {
  return (
    <div className={`public-metric public-metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function PublicLanding() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

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
  ] : [];

  return (
    <main className="public-page">
      <section className="public-hero">
        <div className="public-hero__copy">
          <p className="public-label">Kenya EVD/BVD surveillance</p>
          <h1>Current Ebola situation update</h1>
          <p>
            Aggregate national update for public awareness. Only public
            indicators are shown here.
          </p>
          <div className="public-actions">
            <a className="btn btn--primary" href="tel:147">Dial 147</a>
            <Link className="btn btn--secondary" href="/executive">Executive dashboard</Link>
          </div>
        </div>

        <div className="public-status" aria-live="polite">
          <span className="public-status__label">Current status</span>
          <strong>{status === "error" ? "Unable to load update" : "Active surveillance"}</strong>
          <p>{updated ? `Last updated ${updated}` : "Loading latest aggregate figures"}</p>
          {status === "error" ? (
            <button className="btn btn--secondary" type="button" onClick={load}>Retry</button>
          ) : null}
        </div>
      </section>

      <section className="public-band" aria-label="Aggregate figures">
        {status === "ready" ? metrics.map((metric) => (
          <PublicMetric key={metric.label} {...metric} />
        )) : (
          <div className="public-loading">{status === "error" ? "Metrics unavailable" : "Loading metrics..."}</div>
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
