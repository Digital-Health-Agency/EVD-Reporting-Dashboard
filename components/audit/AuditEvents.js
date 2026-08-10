"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { AUTH_ROLE_LABELS, formatDate, parseRoles } from "@/lib/auth-user";
import { baseFilterKey, humanizeToken } from "@/lib/format";

const EM_DASH = "—";

const AUDIT_EVENT_LABELS = {
  pii_export: "Identifiable export",
  pii_column_denied: "Identifiable column denied",
};

const OUTCOME_LABELS = {
  ok: "Allowed",
  denied: "Denied",
  error: "Error",
  aborted: "Interrupted",
};

const OUTCOME_TONES = {
  ok: "active",
  denied: "inactive",
  error: "inactive",
  aborted: "warning",
};

const SEARCH_LENGTH_KEY = "qLength";
const SEARCH_DIGEST_KEY = "qSha256";

function NotAvailable() {
  return <span aria-label="Not available">{EM_DASH}</span>;
}

function eventLabel(eventType) {
  if (typeof eventType !== "string" || !eventType) return EM_DASH;
  return AUDIT_EVENT_LABELS[eventType] || eventType;
}

function columnSummary(columns) {
  if (!Array.isArray(columns) || columns.length === 0) return null;
  const labels = columns
    .filter((name) => typeof name === "string" && name)
    .map(humanizeToken)
    .filter(Boolean);
  return labels.length > 0 ? labels.join(", ") : null;
}

function filterSummary(filters) {
  if (!filters || typeof filters !== "object") return null;
  const named = Object.keys(filters)
    .filter((key) => key !== SEARCH_LENGTH_KEY && key !== SEARCH_DIGEST_KEY)
    .map(baseFilterKey)
    .map(humanizeToken)
    .filter(Boolean);
  const parts = [...new Set(named)].sort();
  const length = filters[SEARCH_LENGTH_KEY];
  if (typeof length === "number") parts.push(`Search (${length} characters)`);
  return parts.length > 0 ? parts.join(", ") : null;
}

function OutcomePill({ outcome }) {
  const value = typeof outcome === "string" && outcome ? outcome : "ok";
  const tone = OUTCOME_TONES[value] || "inactive";
  return <span className={`account-pill account-pill--${tone}`}>{OUTCOME_LABELS[value] || value}</span>;
}

function RolePill({ role }) {
  const names = parseRoles(role);
  if (names.length === 0) {
    return role ? <span className="account-pill account-pill--warning">{role}</span> : null;
  }
  return (
    <span className="account-pill-group">
      {names.map((name) => (
        <span className={`account-pill account-pill--${name}`} key={name}>{AUTH_ROLE_LABELS[name]}</span>
      ))}
    </span>
  );
}

export default function AuditEvents({ embedded = false }) {
  const [events, setEvents] = useState([]);
  const [eventType, setEventType] = useState("all");
  const [actor, setActor] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const limit = 20;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: String(page),
        limit: String(limit),
      };
      if (eventType !== "all") params.eventType = eventType;
      if (actor.trim()) params.actorId = actor.trim();
      const response = await api.get("/audit/events", params);
      setEvents(response.data || []);
      setTotal(Number(response.total || 0));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load audit events.");
    } finally {
      setLoading(false);
    }
  }, [page, eventType, actor]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    setPage(1);
  }, [eventType, actor]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);
  const hasFilters = useMemo(() => eventType !== "all" || Boolean(actor.trim()), [eventType, actor]);

  return (
    <section className={embedded ? "users-section users-section--embedded" : "users-section"}>
      <div className="console-section-head">
        <div>
          <span>Admin</span>
          <h2>Identifiable data access</h2>
          <p>Who opened or exported patient identifiers, when, and which columns were involved.</p>
        </div>
      </div>

      <div className="console-card users-card">
        <div className="users-toolbar">
          <label className="users-search" htmlFor={embedded ? "embedded-audit-actor" : "audit-actor"}>
            <span>Account</span>
            <input
              id={embedded ? "embedded-audit-actor" : "audit-actor"}
              value={actor}
              placeholder="Account id"
              onChange={(event) => setActor(event.target.value)}
            />
          </label>
          <label className="users-filter" htmlFor={embedded ? "embedded-audit-event" : "audit-event"}>
            <span>Event</span>
            <select
              id={embedded ? "embedded-audit-event" : "audit-event"}
              value={eventType}
              onChange={(event) => setEventType(event.target.value)}
            >
              <option value="all">All events</option>
              {Object.entries(AUDIT_EVENT_LABELS).map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </label>
          {hasFilters ? (
            <button className="btn btn--secondary" type="button" onClick={() => {
              setEventType("all");
              setActor("");
            }}>
              Clear
            </button>
          ) : null}
        </div>

        {error ? <p className="form-alert" role="alert">{error}</p> : null}

        <div className="table-wrap">
          <table className="data-table users-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Account</th>
                <th>Event</th>
                <th>Dataset</th>
                <th>Columns</th>
                <th>Filters</th>
                <th className="num">Rows</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>Loading audit events...</td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={8}>No audit events found.</td>
                </tr>
              ) : events.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.createdAt)}</td>
                  <td>
                    <div className="user-cell">
                      <strong>{event.actorName || event.actorId || EM_DASH}</strong>
                      <RolePill role={event.actorRole} />
                    </div>
                  </td>
                  <td>{eventLabel(event.eventType)}</td>
                  <td>{humanizeToken(event.dataset) || EM_DASH}</td>
                  <td>{columnSummary(event.columns) || <NotAvailable />}</td>
                  <td>{filterSummary(event.filters) || <NotAvailable />}</td>
                  <td className="num">
                    {typeof event.rowCount === "number" ? event.rowCount.toLocaleString() : <NotAvailable />}
                  </td>
                  <td><OutcomePill outcome={event.outcome} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && total > 0 ? (
          <div className="users-pagination">
            <span>Showing {rangeStart}-{rangeEnd} of {total.toLocaleString()}</span>
            <div>
              <button className="btn btn--secondary" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button className="btn btn--secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
