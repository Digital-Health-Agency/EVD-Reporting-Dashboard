"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Dashboard from "@/components/Dashboard";
import PoeBubbleMap from "@/components/PoeBubbleMap";
import { DISEASES, DEFAULT_DISEASE } from "@/lib/diseases";

function ComingSoon({ name, color }) {
  return (
    <div className="state">
      <div className="card" style={{ maxWidth: 520, margin: "0 auto", textAlign: "left", padding: "32px 36px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: color || "var(--accent)", flex: "none" }} />
          <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", color: "var(--muted)" }}>
            {name}
          </span>
        </div>
        <h2 style={{ margin: "0 0 10px", fontSize: "1.4rem", fontWeight: 800 }}>Coming Soon</h2>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.7 }}>
          {name} surveillance data is being integrated into the dashboard.
          Our team is working hard to connect this pipeline — check back soon.
        </p>
      </div>
    </div>
  );
}

const POLL_MS = 60_000;

export default function DashboardShell() {
  const [active, setActive] = useState(DEFAULT_DISEASE);
  const [view, setView] = useState("dashboard"); // dashboard | map
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

  // Load on disease change, then poll. Skip for diseases without live data yet.
  useEffect(() => {
    if (active !== "ebola") return;
    load(active);
    const t = setInterval(() => load(active, true), POLL_MS);
    return () => clearInterval(t);
  }, [active, load]);

  return (
    <>
      <header className="appbar">
        <div className="appbar__inner">
          <div className="brand">
            <Image className="brand__logo" src="/nphi-kenya.png" alt="Kenya National Public Health Institute" width={147} height={46} priority />
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
        <nav className="tabs" role="tablist" aria-label="Disease">
          {DISEASES.map((d) => {
            const isActive = d.key === active;
            return (
              <button
                key={d.key}
                role="tab"
                aria-selected={isActive}
                className={`tab ${isActive ? "tab--active" : ""}`}
                style={{ "--tab-accent": d.color }}
                onClick={() => setActive(d.key)}
              >
                <span className="tab__dot" />
                {d.name}
              </button>
            );
          })}
          <button
            className={`tab tab--map ${view === "map" ? "tab--active" : ""}`}
            onClick={() => setView((v) => (v === "map" ? "dashboard" : "map"))}
            title="View screening across points of entry on the map"
          >
            {view === "map" ? "← Dashboard" : "🗺 POE map"}
          </button>
          <button
            className="tab tab--refresh"
            onClick={() => load(active, true)}
            disabled={refreshing}
            title="Re-read the latest values from the warehouse"
          >
            {refreshing ? "Refreshing…" : "↻ Refresh"}
          </button>
        </nav>

<<<<<<< Updated upstream
        {active !== "ebola" ? (
          <ComingSoon
            name={DISEASES.find((d) => d.key === active)?.name}
            color={DISEASES.find((d) => d.key === active)?.color}
          />
        ) : status === "ready" && data ? (
          <Dashboard data={data} />
=======
        {status === "ready" && data ? (
          view === "map" ? (
            <section className="section">
              <div className="section__head">
                <h2 className="section__title">Points of Entry — screening across Kenya</h2>
                <p className="section__src">
                  Every point of entry plotted geographically · bubble size and colour show screening volume · hover for details
                </p>
              </div>
              <div className="card">
                <PoeBubbleMap byPoe={data.poe?.byPoe || []} />
              </div>
            </section>
          ) : (
            <Dashboard data={data} />
          )
>>>>>>> Stashed changes
        ) : status === "error" ? (
          <div className="state">Could not load metrics. Is the warehouse running?</div>
        ) : (
          <div className="state">Loading {DISEASES.find((d) => d.key === active)?.name} metrics…</div>
        )}
      </div>
    </>
  );
}
