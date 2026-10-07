"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { fmt } from "@/lib/format";
import {
  GROUP_LABELS,
  HEADLINE_FIGURE_FIELDS,
  MAX_NOTES_LENGTH,
  MAX_SOURCE_LENGTH,
  deriveCfr,
  fieldLabel,
  figureDifference,
  figuresToPayload,
  formatSigned,
  nairobiToday,
  parseFigureInput,
  saveFailure,
} from "@/lib/headline-figures";

const EM_DASH = "—";

const EMPTY_META = { situation_date: "", report_date: "", source_label: "", notes: "", operational_override: false };
const EMPTY_FIGURES = Object.fromEntries(HEADLINE_FIGURE_FIELDS.map(({ key }) => [key, ""]));

function NotReported() {
  return <span aria-label="Not reported">{EM_DASH}</span>;
}

export default function ReconciliationForm({
  initialRow,
  warehouse,
  warehouseError,
  submitLabel = "Save figures",
  onSubmit,
  onCancel,
  onReload,
}) {
  const [meta, setMeta] = useState(EMPTY_META);
  const [figures, setFigures] = useState(EMPTY_FIGURES);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);
  const alertRef = useRef(null);
  const actionsRef = useRef(null);

  useEffect(() => {
    if (!failure) return;
    actionsRef.current?.scrollIntoView({ block: "nearest" });
    alertRef.current?.scrollIntoView({ block: "nearest" });
  }, [failure]);

  useEffect(() => {
    if (!initialRow) return;
    setMeta({
      situation_date: initialRow.situation_date || "",
      report_date: initialRow.report_date || "",
      source_label: initialRow.source_label || "",
      notes: initialRow.notes || "",
      operational_override: initialRow.operational_override === true,
    });
    setFigures(
      Object.fromEntries(
        HEADLINE_FIGURE_FIELDS.map(({ key }) => {
          const value = initialRow[key];
          return [key, value == null ? "" : String(value)];
        }),
      ),
    );
  }, [initialRow]);

  function enteredValue(key) {
    const parsed = parseFigureInput(figures[key]);
    return parsed.ok ? parsed.value : null;
  }

  function warehouseValue(key) {
    const value = warehouse?.figures?.[key];
    return typeof value === "number" ? value : null;
  }

  function invalid(field) {
    return failure?.field === field ? "true" : undefined;
  }

  function reject(message, field, inputId) {
    setFailure({ message, field });
    document.getElementById(inputId)?.focus({ preventScroll: true });
  }

  async function submit(event) {
    event.preventDefault();
    if (!meta.situation_date) {
      reject("Situation date is required.", "situation_date", "situation-date");
      return;
    }
    if (!initialRow && meta.situation_date > nairobiToday()) {
      reject("Situation date cannot be in the future.", "situation_date", "situation-date");
      return;
    }
    const result = figuresToPayload(figures);
    if (!result.ok) {
      reject(
        `Enter whole numbers of 0 or more. Check ${fieldLabel(result.key)}.`,
        result.key,
        `figure-${result.key}`,
      );
      return;
    }
    setBusy(true);
    setFailure(null);

    try {
      await onSubmit({
        situation_date: meta.situation_date,
        report_date: meta.report_date || null,
        source_label: meta.source_label.trim() || null,
        notes: meta.notes.trim() || null,
        operational_override: meta.operational_override,
        ...result.payload,
      });
    } catch (caught) {
      setFailure(saveFailure(caught));
      setBusy(false);
    }
  }

  const cfr = deriveCfr(enteredValue("deaths"), enteredValue("confirmed_cases"));

  return (
    <form className="console-form" noValidate onSubmit={submit}>
      {warehouseError ? (
        <p className="form-alert">Could not load warehouse figures. Entered values can still be saved.</p>
      ) : null}
      <div className="form-grid">
        <label className="form-field" htmlFor="situation-date">
          <span>Situation date</span>
          <input
            id="situation-date"
            type="date"
            required
            max={initialRow ? undefined : nairobiToday()}
            aria-invalid={invalid("situation_date")}
            readOnly={Boolean(initialRow)}
            title="The Kenya as-of date, one day before the brief's report date."
            value={meta.situation_date}
            onChange={(event) => setMeta((current) => ({ ...current, situation_date: event.target.value }))}
          />
        </label>
        <label className="form-field" htmlFor="report-date">
          <span>Report date</span>
          <input
            id="report-date"
            type="date"
            aria-invalid={invalid("report_date")}
            value={meta.report_date}
            onChange={(event) => setMeta((current) => ({ ...current, report_date: event.target.value }))}
          />
        </label>
      </div>
      <div className="form-grid">
        <label className="form-field" htmlFor="source-label">
          <span>Source</span>
          <input
            id="source-label"
            type="text"
            maxLength={MAX_SOURCE_LENGTH}
            aria-invalid={invalid("source_label")}
            placeholder="e.g. CS press release 6 Oct 2026"
            value={meta.source_label}
            onChange={(event) => setMeta((current) => ({ ...current, source_label: event.target.value }))}
          />
        </label>
        <label className="form-field" htmlFor="row-notes">
          <span>Notes</span>
          <input
            id="row-notes"
            type="text"
            maxLength={MAX_NOTES_LENGTH}
            aria-invalid={invalid("notes")}
            value={meta.notes}
            onChange={(event) => setMeta((current) => ({ ...current, notes: event.target.value }))}
          />
        </label>
      </div>
      <label className="reconciliation-switch" htmlFor="operational-override">
        <input id="operational-override" type="checkbox" role="switch" checked={meta.operational_override} onChange={(event) => setMeta((current) => ({ ...current, operational_override: event.target.checked }))} />
        <span><strong>Override operational dashboard</strong><span>Off by default. When on, these figures also replace national headline values in the operational summary. Geographic views keep warehouse figures.</span></span>
      </label>
      <p className="form-check__hint">
        Leave a field blank if it was not reported. Cumulative figures carry forward from the most recent official value, then fall back to the warehouse. 24-hour figures and screening points use only this date. Enter 0 only when the official figure is zero.
      </p>
      {warehouse === undefined && !warehouseError ? (
        <p className="form-check__hint">Loading warehouse figures...</p>
      ) : null}
      <div className="table-wrap">
        <table className="data-table reconciliation-table">
          <thead>
            <tr>
              <th>Field</th>
              <th className="num">Warehouse</th>
              <th className="num">Entered</th>
              <th className="num">Difference</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(GROUP_LABELS).map(([group, groupLabel]) => (
              <Fragment key={group}>
                <tr className="reconciliation-table__group">
                  <th colSpan={4}>{groupLabel}</th>
                </tr>
                {HEADLINE_FIGURE_FIELDS.filter((field) => field.group === group).map(({ key, label, tooltip }) => {
                  const inWarehouse = warehouseValue(key);
                  const difference = figureDifference(enteredValue(key), inWarehouse);
                  return (
                    <tr key={key}>
                      <th scope="row" title={tooltip}>{label}</th>
                      <td className="num">{inWarehouse === null ? <NotReported /> : fmt(inWarehouse)}</td>
                      <td className="num">
                        <input
                          id={`figure-${key}`}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder={EM_DASH}
                          aria-label={`${label}, entered value`}
                          aria-invalid={invalid(key)}
                          value={figures[key]}
                          onChange={(event) =>
                            setFigures((current) => ({ ...current, [key]: event.target.value.replace(/[\s,]/g, "") }))
                          }
                        />
                      </td>
                      <td className="num">{difference === null ? <NotReported /> : formatSigned(difference)}</td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="form-check__hint">
        Case fatality rate is calculated from deaths and confirmed cases; it is not entered.
        {cfr === null ? null : ` From entered figures: ${cfr.toFixed(1)}%`}
      </p>
      {failure ? (
        <p className="form-alert" role="alert" ref={alertRef}>{failure.message}</p>
      ) : null}
      <div className="form-actions" ref={actionsRef}>
        <button className="btn btn--secondary" type="button" onClick={failure?.conflict && onReload ? onReload : onCancel}>{failure?.conflict && onReload ? "Reload latest figures" : "Cancel"}</button>
        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
