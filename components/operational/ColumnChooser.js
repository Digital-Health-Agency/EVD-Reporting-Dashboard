"use client";

import { useState } from "react";

export default function ColumnChooser({ allColumns, chosen, defaults, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const selected = Array.isArray(chosen) && chosen.length > 0
    ? chosen
    : (Array.isArray(defaults) ? defaults : []);
  const selectedSet = new Set(selected);

  const defaultSet = new Set(Array.isArray(defaults) ? defaults : []);
  const shownByDefault = allColumns.filter((column) => defaultSet.has(column.name));
  const additional = allColumns.filter((column) => !defaultSet.has(column.name));

  function emit(names) {
    const wanted = new Set(names);
    onChange(allColumns
      .map((column) => column.name)
      .filter((name) => wanted.has(name)));
  }

  function toggle(columnName, checked) {
    const next = new Set(selected);
    if (checked) next.add(columnName);
    else next.delete(columnName);
    emit(next);
  }

  function selectAll() {
    emit(allColumns.map((column) => column.name));
  }

  function clearAll() {
    const first = allColumns[0];
    if (!first) return;
    emit([first.name]);
  }

  function resetToDefault() {
    emit(defaultSet.size > 0 ? [...defaultSet] : allColumns.map((column) => column.name));
  }

  function optionFor(column) {
    const checked = selectedSet.has(column.name);
    return (
      <label className="ops-linelist__column-option" key={column.name}>
        <input
          type="checkbox"
          checked={checked}
          disabled={checked && selected.length === 1}
          onChange={(event) => toggle(column.name, event.target.checked)}
        />
        <span>{column.label}</span>
      </label>
    );
  }

  return (
    <div className="ops-linelist__columns">
      <button
        className="btn btn--secondary ops-linelist__columns-trigger"
        type="button"
        aria-expanded={expanded}
        aria-controls="linelist-columns-panel"
        onClick={() => setExpanded((current) => !current)}
      >{`Columns · ${selected.length} of ${allColumns.length}`}</button>

      {expanded ? (
        <div
          className="ops-linelist__columns-panel"
          id="linelist-columns-panel"
          role="group"
          aria-label="Visible columns"
        >
          <div className="ops-linelist__columns-head">
            <strong>Visible columns</strong>
            <div className="ops-linelist__columns-actions">
              <button className="ops-linelist__columns-action" type="button" onClick={resetToDefault}>
                Reset to default
              </button>
              <button className="ops-linelist__columns-action" type="button" onClick={selectAll}>
                Select all
              </button>
              <button className="ops-linelist__columns-action" type="button" onClick={clearAll}>
                Clear all
              </button>
            </div>
          </div>

          {shownByDefault.length > 0 ? (
            <>
              <span className="ops-linelist__columns-group">Shown by default</span>
              {shownByDefault.map(optionFor)}
            </>
          ) : null}

          {additional.length > 0 ? (
            <>
              <span className="ops-linelist__columns-group">Additional columns</span>
              {additional.map(optionFor)}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
