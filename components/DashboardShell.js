"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Dashboard from "@/components/Dashboard";
import PoeBubbleMap from "@/components/PoeBubbleMap";
import { DISEASES, DEFAULT_DISEASE } from "@/lib/diseases";

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

  // Load on disease change, then poll.
  useEffect(() => {
    load(active);
    const t = setInterval(() => load(active, true), POLL_MS);
    return () => clearInterval(t);
  }, [active, load]);

  return (
    <main className="container executive-page">
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
          {view === "map" ? "Dashboard" : "POE map"}
        </button>
        <button
          className="tab tab--refresh"
          onClick={() => load(active, true)}
          disabled={refreshing}
          title="Re-read the latest values from the warehouse"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </nav>

      {status === "ready" && data ? (
        view === "map" ? (
          <section className="section">
            <div className="section__head">
              <h2 className="section__title">Points of Entry - screening across Kenya</h2>
              <p className="section__src">
                Every point of entry plotted geographically. Bubble size and colour show screening volume.
              </p>
            </div>
            <div className="card">
              <PoeBubbleMap byPoe={data.poe?.byPoe || []} />
            </div>
          </section>
        ) : (
          <Dashboard data={data} />
        )
      ) : status === "error" ? (
        <div className="state">Could not load metrics. Is the warehouse running?</div>
      ) : (
        <div className="state">Loading {DISEASES.find((d) => d.key === active)?.name} metrics...</div>
      )}
    </main>
  );
}
