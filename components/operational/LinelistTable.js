import { Skeleton } from "@/components/ui/skeleton";

export const EN_DASH = "–";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

const DISPLAY_TIME_ZONE = "Africa/Nairobi";

const DATETIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  timeZone: DISPLAY_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const STATUS_SEVERITY = Object.freeze({
  POSITIVE: "alert",
  CONFIRMED: "alert",
  DECEASED: "alert",
  DIED: "alert",
  ABNORMAL: "alert",
  REACTIVE: "alert",
  NEGATIVE: "success",
  NORMAL: "success",
  RECOVERED: "success",
  NOT_DETECTED: "success",
  DISCARDED: "success",
  PENDING: "warning",
  ON_TREATMENT: "warning",
  UNDER_INVESTIGATION: "warning",
  IN_PROGRESS: "warning",
  SUSPECTED: "info",
  PROBABLE: "info",
  VERIFIED: "info",
  INVESTIGATED: "info",
  UNKNOWN: "neutral",
  NOT_APPLICABLE: "neutral",
});

const NEUTRAL_SEVERITY = "neutral";

function normalizeStatus(value) {
  return String(value).trim().toUpperCase().replace(/\s+/g, "_");
}

export function severityOf(value) {
  if (value === null || value === undefined) return NEUTRAL_SEVERITY;
  const key = normalizeStatus(value);
  if (!Object.prototype.hasOwnProperty.call(STATUS_SEVERITY, key)) return NEUTRAL_SEVERITY;
  return STATUS_SEVERITY[key];
}

export function statusLabel(value) {
  const text = String(value).trim();
  if (text.length === 0) return text;
  const words = text.replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function calendarDateText(value) {
  const match = CALENDAR_DATE.exec(String(value));
  if (!match) return String(value);

  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return String(value);
  return `${Number(match[3])} ${month} ${match[1]}`;
}

export function instantText(value) {
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.valueOf())) return String(value);
  return DATETIME_FORMAT.format(parsed);
}

export function booleanText(value) {
  if (value === true || value === "true" || value === "t" || value === 1) return "Yes";
  if (value === false || value === "false" || value === "f" || value === 0) return "No";
  return String(value);
}

function LoadingRows({ columnCount }) {
  return Array.from({ length: 10 }, (_, index) => (
    <tr key={`loading-${index}`}>
      <td colSpan={Math.max(columnCount, 1)}>
        <Skeleton className="ops-skeleton ops-skeleton--row" />
      </td>
    </tr>
  ));
}

function CellBody({ format, value }) {
  if (format === "status") {
    const severity = severityOf(value);
    return (
      <span className={`ops-linelist__chip ops-linelist__chip--${severity}`}>
        {statusLabel(value)}
      </span>
    );
  }

  if (format === "boolean") {
    const text = booleanText(value);
    return (
      <span className={text === "No" ? "ops-linelist__quiet" : undefined}>{text}</span>
    );
  }

  const text = format === "date"
    ? calendarDateText(value)
    : format === "datetime"
      ? instantText(value)
      : String(value);

  return (
    <span
      className={`ops-linelist__cell-clamp${format === "identifier" ? " ops-linelist__mono" : ""}`}
      title={text}
    >
      {text}
    </span>
  );
}

export default function LinelistTable({ columns, rows, loading, ariaLabel, sort, onSort }) {
  const severityColumn = columns.find((column) => column.format === "status") || null;

  return (
    <div className="table-wrap">
      <table className="data-table" aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort?.sortBy === column.name;
              const direction = active ? sort.sortDir : null;
              return (
                <th
                  key={column.name}
                  className={column.format === "number" ? "num" : undefined}
                  aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
                >
                  {column.sortable ? (
                    <button
                      className="ops-linelist__sort"
                      type="button"
                      aria-label={`Sort by ${column.label}`}
                      onClick={() => onSort(column.name)}
                    >
                      <span>{column.label}</span>
                      {active ? <span aria-hidden="true">{direction === "asc" ? "▲" : "▼"}</span> : null}
                    </button>
                  ) : column.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody aria-busy={loading ? "true" : undefined}>
          {loading ? <LoadingRows columnCount={columns.length} /> : rows.map((row, rowIndex) => (
            <tr
              key={row.id ?? row.key ?? rowIndex}
              data-severity={severityColumn ? severityOf(row[severityColumn.name]) : undefined}
            >
              {columns.map((column) => {
                const cell = row[column.name];
                const missing = cell === null || cell === undefined;
                const numeric = column.format === "number" || typeof cell === "number";
                return (
                  <td key={column.name} className={numeric ? "num" : undefined}>
                    {missing ? (
                      <span className="ops-linelist__null">{EN_DASH}</span>
                    ) : (
                      <CellBody format={column.format} value={cell} />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
