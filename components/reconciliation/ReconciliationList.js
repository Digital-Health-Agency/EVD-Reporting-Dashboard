"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { fmt } from "@/lib/format";
import { formatSituationDate } from "@/lib/headline-figures";

const EM_DASH = "—";

const FIGURE_COLUMNS = [
  ["confirmed_cases", "Confirmed"],
  ["confirmed_cases_24h", "New (24h)"],
  ["deaths", "Deaths"],
  ["samples_tested_total", "Samples tested"],
  ["travellers_screened_total", "Screened"],
  ["contacts_listed", "Contacts"],
];

function NotReported() {
  return <span aria-label="Not reported">{EM_DASH}</span>;
}

export default function ReconciliationList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/reconciliation/headline");
      setRows(response.data || []);
    } catch (caught) {
      setError(`Could not load official figures. ${caught instanceof Error ? caught.message : "Check your connection and try again."}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  async function clearRow(situationDate) {
    setConfirming(null);
    setMessage("");
    setError("");
    try {
      const row = rows.find((entry) => entry.situation_date === situationDate);
      await api.delete(`/reconciliation/headline/${situationDate}`, { expected_revision: row.revision, expected_record_id: row.record_id });
      setMessage(`Figures for ${formatSituationDate(situationDate)} cleared.`);
      await fetchRows();
    } catch (caught) {
      setError(`Could not clear figures. ${caught instanceof Error ? caught.message : "Check your connection and try again."}`);
    }
  }

  return (
    <section className="users-section">
      <div className="console-section-head">
        <div>

          <h2>Official headline figures</h2>
          <p>Port-health figures by situation date. Entered values replace public dashboard headline figures. Operational overrides are optional for each date.</p>
        </div>
        <Link className="btn btn--primary" href="/reconciliation/new">Add date</Link>
      </div>

      <div className="console-card reconciliation-card">
        {message ? <p className="form-success" role="status">{message}</p> : null}
        {error ? (
          <>
            <p className="form-alert" role="alert">{error}</p>
            <button className="btn btn--secondary" type="button" onClick={fetchRows}>Retry</button>
          </>
        ) : null}

        <div className="table-wrap">
          <table className="data-table reconciliation-list">
            <thead>
              <tr>
                <th>Situation date</th>
                <th>Report date</th>
                {FIGURE_COLUMNS.map(([key, label]) => (
                  <th className="num" key={key}>{label}</th>
                ))}
                <th>Operational override</th>
                <th>Source</th>
                <th className="num">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11}>Loading official figures...</td>
                </tr>
              ) : rows.length === 0 ? (
                error ? null : (
                  <tr>
                    <td colSpan={11}>
                      <div className="user-cell">
                        <strong>No official figures entered</strong>
                        <span>Add a date to enter the port-health headline figures. Until then the dashboard shows warehouse numbers.</span>
                      </div>
                    </td>
                  </tr>
                )
              ) : rows.map((row, index) => {
                const formatted = formatSituationDate(row.situation_date);
                const previous = index === 0 ? rows[1] : null;
                return (
                  <tr key={row.situation_date}>
                    <td className="reconciliation-list__date">
                      {index === 0 ? (
                        <div className="user-cell">
                          {formatted}
                          <span className="account-pill-group">
                            <span className="account-pill account-pill--active" title="Shown on the public dashboard">Live</span>
                          </span>
                        </div>
                      ) : formatted}
                    </td>
                    <td className="reconciliation-list__date">
                      {row.report_date ? formatSituationDate(row.report_date) : <NotReported />}
                    </td>
                    {FIGURE_COLUMNS.map(([key]) => (
                      <td className="num" key={key}>
                        {Number.isFinite(row[key]) ? fmt(row[key]) : <NotReported />}
                      </td>
                    ))}
                    <td><span className={`account-pill account-pill--${row.operational_override ? "active" : "inactive"}`}>{row.operational_override ? "On" : "Off"}</span></td>
                    <td className="reconciliation-list__source">
                      {row.source_label ? (
                        <span className="ops-linelist__cell-clamp" title={row.source_label}>{row.source_label}</span>
                      ) : <NotReported />}
                    </td>
                    <td>
                      {confirming === row.situation_date ? (
                        <div className="reconciliation-list__confirm">
                          <span>
                            Clear {formatted}?{" "}
                            {previous
                              ? `This row is live. The public dashboard will show the ${formatSituationDate(previous.situation_date)} figures instead.`
                              : "The dashboard will fall back to warehouse figures for this date."}
                          </span>
                          <div className="table-actions">
                            <button className="btn btn--table btn--danger" type="button" onClick={() => clearRow(row.situation_date)}>Clear figures</button>
                            <button className="btn btn--table" type="button" onClick={() => setConfirming(null)}>Keep figures</button>
                          </div>
                        </div>
                      ) : (
                        <div className="table-actions">
                          <Link className="btn btn--table" href={`/reconciliation/${row.situation_date}`}>View / edit</Link>
                          <button className="btn btn--table" type="button" onClick={() => setConfirming(row.situation_date)}>Clear</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
