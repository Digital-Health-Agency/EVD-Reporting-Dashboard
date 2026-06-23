"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Dashboard from "@/components/Dashboard";
import { DISEASES, DEFAULT_DISEASE } from "@/lib/diseases";

const POLL_MS = 60_000; // marts are refreshed by the pipeline; re-read every 60s

// Top-level shell: disease tabs + data fetching. The UI talks ONLY to the
// API routes (the data-layer seam) — never to the warehouse directly.
export default function DashboardShell() {
  const [active, setActive] = useState(DEFAULT_DISEASE);
  const [data, setData] = useState(null);
  const [counts, setCounts] = useState({}); // disease name -> tests_done
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [refreshing, setRefreshing] = useState(false);
  const reqId = useRef(0);

  // Cross-disease test counts for the tab badges (best-effort).
  const loadCounts = useCallback(() => {
    fetch("/api/metrics", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (Array.isArray(rows)) setCounts(Object.fromEntries(rows.map((r) => [r.disease, r.total])));
      })
      .catch(() => {});
  }, []);

  // Composed payload for the active disease. background=true keeps the current
  // view visible (no skeleton flash) during polls / manual refresh.
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
        if (id !== reqId.current) return; // stale response
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

  useEffect(() => { loadCounts(); }, [loadCounts]);

  // Load on disease change, then poll that disease in the background.
  useEffect(() => {
    load(active);
    const t = setInterval(() => { load(active, true); loadCounts(); }, POLL_MS);
    return () => clearInterval(t);
  }, [active, load, loadCounts]);

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
            const count = counts[d.name];
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
                {typeof count === "number" ? <span className="tab__count">{count}</span> : null}
              </button>
            );
          })}
          <button
            className="tab tab--refresh"
            onClick={() => { load(active, true); loadCounts(); }}
            disabled={refreshing}
            title="Re-read the latest values from the warehouse"
          >
            {refreshing ? "Refreshing…" : "↻ Refresh"}
          </button>
        </nav>

        {status === "ready" && data ? (
          <Dashboard data={data} />
        ) : status === "error" ? (
          <div className="state">Could not load metrics. Is the warehouse running?</div>
        ) : (
          <div className="state">Loading {DISEASES.find((d) => d.key === active)?.name} metrics…</div>
        )}
      </div>
    </>
  );
}
