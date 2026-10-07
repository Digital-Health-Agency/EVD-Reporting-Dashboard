"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/auth-user";
import AuditValues from "@/components/audit/AuditValues";

const ACTIONS = { create: "Created", update: "Updated", delete: "Cleared" };

export default function RecordAuditTrail({ situationDate }) {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    api.get(`/reconciliation/headline/${encodeURIComponent(situationDate)}/history`, { page: String(page), limit: "20" })
      .then((result) => { if (mounted) { setEvents(result.data || []); setTotal(result.total || 0); } })
      .catch((caught) => { if (mounted) setError(caught.message || "Could not load this record’s history."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [situationDate, page, retry]);
  return (
    <section className="console-card record-audit" aria-labelledby="record-audit-title">
      <div className="console-section-head"><div><h2 id="record-audit-title">Record audit trail</h2><p>Every saved change for this situation date, with the values before and after.</p></div></div>
      {error ? <div><p className="form-alert" role="alert">{error}</p><button className="btn btn--secondary" type="button" onClick={() => setRetry((value) => value + 1)}>Retry history</button></div> : null}
      <div className="table-wrap"><table className="data-table record-audit-table">
        <thead><tr><th scope="col">When</th><th scope="col">Account</th><th scope="col">Action</th><th scope="col">Changed values</th></tr></thead>
        <tbody>{loading ? <tr><td colSpan={4} role="status">Loading record history…</td></tr> : !events.length ? <tr><td colSpan={4}>{error ? "History unavailable." : "No saved changes recorded for this date."}</td></tr> : events.map((event) => (
          <tr key={event.id}><td className="audit-time">{formatDate(event.createdAt)}<span>{new Date(event.createdAt).toLocaleTimeString("en-KE", { timeZone: "Africa/Nairobi", hour: "2-digit", minute: "2-digit" })} EAT</span></td><td>{event.actorName || event.actorId || (event.actorRole === "seed" ? "Seed script" : "Unknown account")}</td><td>{ACTIONS[event.filters?.action] || event.filters?.action}</td><td><AuditValues event={event} /></td></tr>
        ))}</tbody>
      </table></div>
      {total > 20 ? <div className="users-pagination"><span>{total} events · Page {page} of {Math.ceil(total / 20)}</span><div><button className="btn btn--secondary" type="button" disabled={loading || page <= 1} onClick={() => setPage(page - 1)}>Prev</button><button className="btn btn--secondary" type="button" disabled={loading || page * 20 >= total} onClick={() => setPage(page + 1)}>Next</button></div></div> : null}
    </section>
  );
}
