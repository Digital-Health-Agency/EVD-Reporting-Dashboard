"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Dialog } from "@/components/ui/dialog";
import { api } from "@/lib/api-client";
import { fmt } from "@/lib/format";
import { exportLinelist } from "@/lib/linelist-export";
import { buildLinelistParams, DATASET_PATHS } from "./card-linelist-map";
import ColumnChooser from "./ColumnChooser";
import LinelistPager from "./LinelistPager";
import LinelistTable, { statusLabel } from "./LinelistTable";

const EMPTY_PAYLOAD = Object.freeze({
  availableColumns: [],
  columns: [],
  data: [],
  total: 0,
  page: 1,
  limit: 50,
});
const SEARCH_DEBOUNCE_MS = 250;

const SCOPE_LABELS = Object.freeze({
  period: "Period",
  from: "From",
  to: "To",
  lab: "Lab",
  poe: "POE",
  ageGroup: "Age group",
  signalStatus: "Signal status",
  signalType: "Signal type",
  communitySource: "Source",
  classification: "Classification",
  resultStatus: "Result",
  treatmentOutcome: "Outcome",
});

const PERIOD_TEXT = Object.freeze({
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "21d": "Last 21 days",
  "42d": "Last 42 days",
  custom: "Custom range",
});

export function scopeChips(entry, tabParams) {
  const chips = [];

  function push(source, key, value) {
    if (value === null || value === undefined || value === "") return;
    const label = SCOPE_LABELS[key];
    if (!label) return;
    const text = key === "period"
      ? (PERIOD_TEXT[value] || String(value))
      : statusLabel(value);
    chips.push({ id: `${source}-${key}`, label, text });
  }

  for (const [key, value] of Object.entries(tabParams || {})) push("tab", key, value);
  for (const [key, value] of Object.entries(entry?.predicate || {})) push("card", key, value);

  return chips;
}

function SearchGlyph() {
  return (
    <svg
      className="ops-linelist__search-glyph"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="7" cy="7" r="4.5" />
      <line x1="10.4" y1="10.4" x2="14" y2="14" strokeLinecap="round" />
    </svg>
  );
}

function DownloadGlyph() {
  return (
    <svg
      className="ops-linelist__download-glyph"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 2v7" strokeLinecap="round" />
      <path d="m5 6 3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 11v2h10v-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function countText(payload) {
  const total = Number(payload.total || 0);
  if (total === 0) return "";

  const page = Number(payload.page || 1);
  const limit = Number(payload.limit || 50);
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  if (from === 1 && to === 1) return "Showing 1 of 1";
  return `Showing ${fmt(from)}–${fmt(to)} of ${fmt(total)}`;
}

function EmptyState({ noun, query, onClear }) {
  const searchActive = query.trim().length > 0;
  return (
    <div className="ops-linelist-empty">
      <strong>{searchActive ? "No records match your search" : "No records in this selection"}</strong>
      {searchActive ? (
        <>
          <p>No {noun} match “{query.trim()}”. Clear the search or widen the period.</p>
          <button className="btn btn--secondary" type="button" onClick={onClear}>Clear search</button>
        </>
      ) : (
        <p>No {noun} match the current filters. Widen the period or clear a filter.</p>
      )}
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  const expired = error?.status === 401;
  return (
    <div className="ops-linelist-error" role="alert">
      <p>{expired ? "Your session has expired. Sign in again." : "Could not load this linelist."}</p>
      {expired ? (
        <Link className="btn btn--secondary" href="/login?next=/operational">Sign in</Link>
      ) : (
        <button className="btn btn--secondary" type="button" onClick={onRetry}>Try again</button>
      )}
    </div>
  );
}

export default function LinelistModal({ open, onClose, entry, tabParams }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(EMPTY_PAYLOAD);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState(null);
  const [chosen, setChosen] = useState(null);
  const [defaults, setDefaults] = useState(null);
  const [preparingExport, setPreparingExport] = useState(false);
  const [exportError, setExportError] = useState(false);
  const requestRef = useRef(0);

  const unavailable = Boolean(entry?.unavailable);
  const path = entry && !unavailable ? DATASET_PATHS[entry.dataset] : null;
  const paramsKey = entry
    ? JSON.stringify(buildLinelistParams(entry, tabParams, {
      q: debouncedQ,
      page,
      sortBy,
      sortDir,
      fields: chosen,
      defaults,
    }))
    : null;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    if (open && entry) return;
    requestRef.current += 1;
    setLoading(false);
    setError(null);
    setPayload(EMPTY_PAYLOAD);
    setQ("");
    setDebouncedQ("");
    setPage(1);
    setSortBy(null);
    setSortDir(null);
    setChosen(null);
    setDefaults(null);
    setPreparingExport(false);
    setExportError(false);
  }, [entry, open]);

  function handleSort(columnName) {
    setSortDir((current) => sortBy === columnName && current === "asc" ? "desc" : "asc");
    setSortBy(columnName);
    setPage(1);
  }

  async function handleExport() {
    if (!path || !paramsKey || preparingExport) return;

    setPreparingExport(true);
    setExportError(false);
    try {
      await new Promise((resolve) => window.requestAnimationFrame(resolve));
      const {
        page: _page,
        limit: _limit,
        pageSize: _pageSize,
        ...exportParams
      } = JSON.parse(paramsKey);
      exportLinelist(path, exportParams);
    } catch {
      setExportError(true);
    } finally {
      setPreparingExport(false);
    }
  }

  const load = useCallback(async () => {
    if (!path || !paramsKey) return;

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);
    setError(null);
    try {
      const next = await api.get(`/operational/linelist/${path}`, JSON.parse(paramsKey));
      if (requestId !== requestRef.current) return;
      setPayload({ ...EMPTY_PAYLOAD, ...next });
      const nextChosen = Array.isArray(next.columns)
        ? next.columns.map((column) => column.name)
        : [];
      if (nextChosen.length > 0) {
        setChosen(nextChosen);
        setDefaults((current) => current ?? nextChosen);
      }
    } catch (caught) {
      if (requestId !== requestRef.current) return;
      setError(caught);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [paramsKey, path]);

  useEffect(() => {
    if (!open || !entry) return undefined;
    load();
    return () => {
      requestRef.current += 1;
    };
  }, [entry, load, open]);

  if (!entry) return null;

  const total = Number(payload.total || 0);
  const columns = Array.isArray(payload.columns) ? payload.columns : [];
  const availableColumns = Array.isArray(payload.availableColumns) ? payload.availableColumns : [];
  const rows = Array.isArray(payload.data) ? payload.data : [];
  const limit = Number(payload.limit || 50);
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const displayedPage = loading || error ? Number(payload.page || 1) : page;
  const scope = scopeChips(entry, tabParams);

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onClose();
    }}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup className="ops-linelist">
          <header className="ops-linelist__head">
            <div className="ops-linelist__head-main">
              <Dialog.Title>{entry.listLabel}</Dialog.Title>
              {scope.length > 0 ? (
                <div className="ops-linelist__scope">
                  {scope.map((chip) => (
                    <span className="ops-linelist__scope-chip" key={chip.id}>
                      <span className="ops-linelist__scope-key">{chip.label}</span>
                      {chip.text}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="ops-linelist__head-actions">
              {unavailable ? null : exportError ? (
                <div className="ops-linelist__export-error" role="alert">
                  <span>Export could not be started.</span>
                  <button className="btn btn--secondary" type="button" onClick={handleExport}>
                    Try again
                  </button>
                </div>
              ) : null}
              {unavailable ? null : (
                <button
                  className="btn btn--primary ops-linelist__export"
                  type="button"
                  disabled={preparingExport}
                  aria-busy={preparingExport}
                  onClick={handleExport}
                >
                  <DownloadGlyph />
                  {preparingExport ? "Preparing download…" : "Export CSV"}
                </button>
              )}
              <Dialog.Close className="ops-linelist__head-close" aria-label="Close">×</Dialog.Close>
            </div>
          </header>

          <div className="ops-linelist__controls">
            <div className="ops-linelist__search">
              <SearchGlyph />
              <input
                id="linelist-search"
                value={q}
                maxLength={200}
                aria-label="Search these records"
                placeholder="Search these records"
                onChange={(event) => {
                  setQ(event.target.value);
                  setPage(1);
                }}
              />
              {q.length > 0 ? (
                <button
                  className="ops-linelist__search-clear"
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQ("");
                    setPage(1);
                  }}
                >×</button>
              ) : null}
            </div>
            {unavailable ? null : (
              <ColumnChooser
                allColumns={availableColumns}
                chosen={chosen ?? columns.map((column) => column.name)}
                defaults={defaults ?? columns.map((column) => column.name)}
                onChange={setChosen}
              />
            )}
            <Dialog.Description aria-live="polite">{countText(payload)}</Dialog.Description>
          </div>

          <div className="ops-linelist__body">
            {error ? (
              <ErrorState error={error} onRetry={load} />
            ) : !loading && total === 0 ? (
              <EmptyState noun={entry.noun} query={q} onClear={() => {
                setQ("");
                setPage(1);
              }} />
            ) : (
              <LinelistTable
                columns={columns}
                rows={rows}
                loading={loading}
                ariaLabel={entry.listLabel}
                sort={{ sortBy, sortDir }}
                onSort={handleSort}
              />
            )}
          </div>

          <footer className="ops-linelist__foot">
            <LinelistPager
              page={displayedPage}
              totalPages={totalPages}
              onPage={setPage}
              busy={loading}
            />
            <Dialog.Close>Close</Dialog.Close>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
