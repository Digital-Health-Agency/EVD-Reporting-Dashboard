"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { fmt } from "@/lib/format";
import { api } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import LinelistModal from "@/components/operational/LinelistModal";
import LinelistPager from "@/components/operational/LinelistPager";
import {
  linelistFor,
  rowLinelistEntry,
} from "@/components/operational/card-linelist-map";
import { Skeleton } from "@/components/ui/skeleton";
import UsersManagement from "@/components/users/UsersManagement";

const EM_DASH = "—";

const BREAKDOWN_PAGE_SIZE = 10;

const DISPLAY_TIME_ZONE = "Africa/Nairobi";

const LAST_UPDATED_FORMAT = new Intl.DateTimeFormat("en-GB", {
  timeZone: DISPLAY_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function latestDataTimestamp(payload) {
  if (!payload) return null;

  const indicators = [
    ...(payload.cards || []),
    ...(payload.charts || []),
    ...(payload.breakdown ? [payload.breakdown] : []),
  ];

  let latest = null;
  for (const indicator of indicators) {
    const stamp = indicator?.meta?.lastUpdated;
    if (!stamp) continue;
    const parsed = new Date(stamp);
    if (Number.isNaN(parsed.getTime())) continue;
    if (latest === null || parsed > latest) latest = parsed;
  }
  return latest;
}

function formatDataAge(payload) {
  const latest = latestDataTimestamp(payload);
  if (!latest) return `Data last updated ${EM_DASH} not reported`;
  return `Data last updated ${LAST_UPDATED_FORMAT.format(latest)}`;
}

const TAB_ENDPOINTS = {
  summary: "/operational/summary",
  labs: "/operational/labs",
  poe: "/operational/poe",
  hf: "/operational/hf",
  community: "/operational/community",
  contacts: "/operational/contacts",
};

const PERIOD_OPTIONS = {
  "Last 24 hours": "24h",
  "Last 7 days": "7d",
  "Last 21 days": "21d",
  "Last 42 days": "42d",
  "All time": "all",
  "Custom": "custom",
};

const CUSTOM_PERIOD_LABEL = "Custom";

const PERIOD_SPAN_DAYS = {
  "24h": 1,
  "7d": 7,
  "21d": 21,
  "42d": 42,
};

function shiftIsoDate(isoDate, deltaDays) {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setUTCDate(parsed.getUTCDate() + deltaDays);
  return parsed.toISOString().slice(0, 10);
}

const FILTER_VALUE_MAP = {
  period: PERIOD_OPTIONS,
};

const FILTER_DEBOUNCE_MS = 250;

const FILTER_FIELDS = {
  period: { label: "Period", options: Object.keys(PERIOD_OPTIONS) },
  lab: { label: "Lab", allLabel: "All labs", optionsKey: "labs" },
  poe: { label: "POE", allLabel: "All POEs", optionsKey: "poes" },
  facility: { label: "Facility", allLabel: "All facilities", optionsKey: "facilities" },
  communitySource: { label: "Source", allLabel: "All sources", optionsKey: "communitySources" },
};

const TAB_FILTERS = {
  summary: ["period"],
  labs: ["period", "lab"],
  poe: ["period", "poe"],
  hf: ["period", "facility"],
  community: ["period", "communitySource"],
  contacts: ["period"],
  users: [],
};

const MIN_OPTIONS_FOR_A_CONTROL = 2;

const EMPTY_FILTER_OPTIONS = {
  labs: [],
  poes: [],
  facilities: [],
  communitySources: [],
};

const OPERATIONAL_TABS = [
  {
    key: "summary",
    label: "Summary",
    title: "Operational summary",
    description: "Alerts, confirmed cases and treatment outcomes across services, with daily signal and sample flow.",
    emptyNoun: "records",
  },
  {
    key: "labs",
    label: "Laboratory",
    title: "Laboratory",
    description: "Tests done and their positive or negative result status, broken down by testing laboratory.",
    emptyNoun: "lab results",
  },
  {
    key: "poe",
    label: "POE",
    title: "Points of entry",
    description: "Traveller screening volume at ports of entry, broken down by point of entry.",
    emptyNoun: "screenings",
  },
  {
    key: "hf",
    label: "Health facilities",
    title: "Health facilities",
    description: "Facility screening volume and alerts, with confirmed, admission and outcome indicators by facility.",
    emptyNoun: "facility screenings",
  },
  {
    key: "community",
    label: "Community",
    title: "Community",
    description: "EVD community signals reported and verified through mDharura, broken down by county.",
    emptyNoun: "community signals",
  },
  {
    key: "contacts",
    label: "Contacts",
    title: "Contacts",
    description: "Contacts registered from case investigations, broken down by county.",
    emptyNoun: "contacts",
  },
  {
    key: "users",
    label: "Users",
    title: "User management",
    description: "Admin-only account, role, status and password actions.",
    emptyNoun: "accounts",
  },
];

const tooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid #e7ebef" };
const axisProps = {
  tick: { fontSize: 11, fill: "#69757f", fontVariantNumeric: "tabular-nums" },
  axisLine: false,
  tickLine: false,
};
const gridProps = { strokeDasharray: "3 3", vertical: false, stroke: "#eef1f4" };
const DEFAULT_FILTERS = {
  period: "Last 21 days",
};

const Y_AXIS_LABEL_MAX = 16;

function truncateCategory(value) {
  const text = String(value ?? "");
  if (text.length <= Y_AXIS_LABEL_MAX) return text;
  return `${text.slice(0, Y_AXIS_LABEL_MAX - 1)}…`;
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function categoryTick(value) {
  const text = String(value ?? "");
  const iso = ISO_DATE.exec(text);
  if (!iso) return text;
  const month = SHORT_MONTHS[Number(iso[2]) - 1];
  if (!month) return text;
  return `${Number(iso[3])} ${month}`;
}

function Chart({ height = 300, children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div style={{ width: "100%", height }}>
      {mounted ? (
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 640, height }}
        >
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

function IndicatorBubble({ text }) {
  return text ? <span className="indicator-tooltip__bubble" role="tooltip">{text}</span> : null;
}

function tooltipAttrs(description, label) {
  if (!description) return {};
  return {
    tabIndex: 0,
    title: description,
    "aria-label": `${label}: ${description}`,
  };
}

function PendingValue({ className = "ops-pending" }) {
  return (
    <strong className={className} aria-label="Not available">
      {EM_DASH}
    </strong>
  );
}

function MetricLabel({ label, pending }) {
  return (
    <span className="ops-metric__label" title={pending ? undefined : label}>
      {label}
    </span>
  );
}

function MetricContent({
  label,
  value,
  valueClassName,
  description,
  descriptionId,
  pending,
  breakdown,
}) {
  return (
    <>
      <MetricLabel label={label} pending={pending} />
      {pending ? <PendingValue /> : <strong className={valueClassName}>{value}</strong>}
      <CardBreakdown entries={breakdown} />
      <small id={description ? descriptionId : undefined}>{description}</small>
      <IndicatorBubble text={description} />
    </>
  );
}

function MetricSurface({
  linelistEntry,
  label,
  description,
  descriptionId,
  onViewLinelist,
  children,
}) {
  return (
    <div className="ops-metric__content">
      {children}
      {linelistEntry ? (
        <button
          type="button"
          className="ops-metric__linelist"
          aria-label={`View linelist for ${label}`}
          aria-describedby={description ? descriptionId : undefined}
          onClick={onViewLinelist}
        >
          View linelist →
        </button>
      ) : null}
    </div>
  );
}

function ImportantMetric({
  tone,
  label,
  value,
  detail,
  pending = false,
  breakdown,
  linelistEntry,
  onViewLinelist,
}) {
  const descriptionId = useId();
  const description = pending ? null : detail;
  return (
    <article
      className={`ops-metric ops-metric--important ops-metric--${tone} indicator-tooltip-host`}
      {...(!linelistEntry ? tooltipAttrs(description, label) : {})}
    >
      <MetricSurface
        linelistEntry={linelistEntry}
        label={label}
        description={description}
        descriptionId={descriptionId}
        onViewLinelist={onViewLinelist}
      >
        <MetricContent
          label={label}
          value={value}
          description={description}
          descriptionId={descriptionId}
          pending={pending}
          breakdown={breakdown}
        />
      </MetricSurface>
    </article>
  );
}

function PlainMetric({
  tone,
  label,
  value,
  detail,
  pending = false,
  breakdown,
  linelistEntry,
  onViewLinelist,
}) {
  const descriptionId = useId();
  const description = pending ? null : detail;
  return (
    <article
      className="ops-metric ops-metric--plain indicator-tooltip-host"
      {...(!linelistEntry ? tooltipAttrs(description, label) : {})}
    >
      <MetricSurface
        linelistEntry={linelistEntry}
        label={label}
        description={description}
        descriptionId={descriptionId}
        onViewLinelist={onViewLinelist}
      >
        <MetricContent
          label={label}
          value={value}
          valueClassName={`is-${tone}`}
          description={description}
          descriptionId={descriptionId}
          pending={pending}
          breakdown={breakdown}
        />
      </MetricSurface>
    </article>
  );
}

function CardBreakdown({ entries }) {
  if (!entries || entries.length === 0) return null;
  return (
    <span className="ops-card-breakdown" role="list">
      {entries.map((entry) => (
        <span key={entry.key} role="listitem">
          <span>{entry.label}</span>
          {entry.value === null || entry.value === undefined ? (
            <em aria-label="Not available">{EM_DASH}</em>
          ) : (
            <em>{cardValue(entry)}</em>
          )}
        </span>
      ))}
    </span>
  );
}

function FilterSelect({ fieldKey, value, onChange, options = [], loading = false }) {
  const field = FILTER_FIELDS[fieldKey];
  const optionsFromApi = Boolean(field.optionsKey);
  const choices = optionsFromApi ? options : field.options;
  const disabled = optionsFromApi && (loading || choices.length === 0);

  return (
    <label className="ops-filter" data-filter={field.label.toLowerCase()}>
      <span>{field.label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(fieldKey, event.target.value)}
      >
        {field.allLabel ? <option key={field.allLabel}>{field.allLabel}</option> : null}
        {choices.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function CustomRangeControl({ range, onChange }) {
  const incomplete = !range.from || !range.to;
  const inverted = !incomplete && range.from > range.to;

  return (
    <div className="ops-custom-range">
      <label className="ops-filter">
        <span>From</span>
        <input
          type="datetime-local"
          value={range.from}
          onChange={(event) => onChange({ ...range, from: event.target.value })}
        />
      </label>
      <label className="ops-filter">
        <span>To</span>
        <input
          type="datetime-local"
          value={range.to}
          onChange={(event) => onChange({ ...range, to: event.target.value })}
        />
      </label>
      {inverted ? (
        <p className="ops-custom-range__hint">The end must be on or after the start.</p>
      ) : null}
    </div>
  );
}

function OperationalTabFilters({
  activeTab,
  filters,
  onChange,
  customRange,
  onCustomRangeChange,
  options = EMPTY_FILTER_OPTIONS,
  optionsLoading = false,
  filtersDirty = false,
  onClear,
}) {
  const fields = (TAB_FILTERS[activeTab.key] || []).filter((fieldKey) => {
    const field = FILTER_FIELDS[fieldKey];
    if (!field.optionsKey) return true;
    if (optionsLoading) return true;
    return (options[field.optionsKey] || []).length >= MIN_OPTIONS_FOR_A_CONTROL;
  });
  if (fields.length === 0) return null;

  return (
    <section className="ops-tab-filter-panel" aria-label={`${activeTab.label} data filters`}>
      {fields.flatMap((fieldKey) => {
        const select = (
          <FilterSelect
            key={`${activeTab.key}-${fieldKey}`}
            fieldKey={fieldKey}
            value={filters[fieldKey]}
            onChange={onChange}
            options={options[FILTER_FIELDS[fieldKey].optionsKey] || []}
            loading={optionsLoading}
          />
        );
        if (fieldKey !== "period") return [select];
        return [
          select,
          <CustomRangeControl
            key={`${activeTab.key}-custom-range`}
            range={customRange}
            onChange={onCustomRangeChange}
          />,
        ];
      })}
      <button
        className="btn ops-clear-filters"
        type="button"
        onClick={onClear}
        disabled={!filtersDirty}
      >
        Clear filters
      </button>
    </section>
  );
}

function tabNeedsOptions(tabKey) {
  return (TAB_FILTERS[tabKey] || []).some(
    (fieldKey) => FILTER_FIELDS[fieldKey].optionsKey,
  );
}

function useFilterOptions(tabKey) {
  const [options, setOptions] = useState(EMPTY_FILTER_OPTIONS);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(0);

  useEffect(() => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!tabNeedsOptions(tabKey)) {
      setOptions(EMPTY_FILTER_OPTIONS);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    api
      .get("/operational/filter-options", { tab: tabKey })
      .then((payload) => {
        if (cancelled || requestId !== requestRef.current) return;
        setOptions({ ...EMPTY_FILTER_OPTIONS, ...payload });
        setLoading(false);
      })
      .catch(() => {
        if (cancelled || requestId !== requestRef.current) return;
        setOptions(EMPTY_FILTER_OPTIONS);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tabKey]);

  return { options, loading };
}

function buildTabParams(tabKey, filters, customRange) {
  const fields = TAB_FILTERS[tabKey] || [];
  const params = {};

  fields.forEach((fieldKey) => {
    const field = FILTER_FIELDS[fieldKey];
    const label = filters[fieldKey];
    if (!label || label === field.allLabel) return;
    const map = FILTER_VALUE_MAP[fieldKey];
    const value = map ? map[label] : label;
    if (value) params[fieldKey] = value;
  });

  if (params.period === "custom") {
    if (!customRange.from || !customRange.to || customRange.from > customRange.to) {
      return null;
    }
    params.from = customRange.from;
    params.to = customRange.to;
  }

  return params;
}

function useOperationalTab(tabKey, filters, customRange) {
  const [payload, setPayload] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestRef = useRef(0);

  const endpoint = TAB_ENDPOINTS[tabKey] || null;
  const params = endpoint ? buildTabParams(tabKey, filters, customRange) : null;
  const paramsKey = params ? JSON.stringify(params) : null;

  const load = useCallback(
    async ({ isRefresh = false } = {}) => {
      if (!endpoint || !paramsKey) return;

      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      if (isRefresh) setRefreshing(true);
      else setStatus("loading");

      try {
        const next = await api.get(endpoint, JSON.parse(paramsKey));
        if (requestId !== requestRef.current) return;
        setPayload(next);
        setError(null);
        setStatus("ready");
      } catch (caught) {
        if (requestId !== requestRef.current) return;
        setError(caught);
        setStatus("error");
      } finally {
        if (requestId === requestRef.current) setRefreshing(false);
      }
    },
    [endpoint, paramsKey],
  );

  useEffect(() => {
    if (!endpoint || !paramsKey) return undefined;
    const timer = setTimeout(() => load(), FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [endpoint, paramsKey, load]);

  const refresh = useCallback(() => load({ isRefresh: true }), [load]);

  return { payload, status, error, refreshing, refresh };
}

function isUnsourcedIndicator(card) {
  return card.provenance?.source === "pending";
}

function isUnavailable(card) {
  return card.meta?.dataQualityStatus === "unavailable";
}

function isSuppressed(widget) {
  return isUnsourcedIndicator(widget) || isUnavailable(widget);
}

function cardValue(card) {
  if (card.value === null || card.value === undefined) return EM_DASH;
  if (card.unit === "percent") return `${fmt(card.value)}%`;
  if (card.unit === "days") return `${fmt(card.value)}d`;
  return fmt(card.value);
}

function MetricCard({ card, tabKey, onViewLinelist }) {
  const Metric = card.emphasis === "important" ? ImportantMetric : PlainMetric;
  const linelistEntry = linelistFor(tabKey, card);
  return (
    <Metric
      tone={card.tone}
      label={card.label}
      value={cardValue(card)}
      detail={card.detail}
      pending={isSuppressed(card)}
      breakdown={card.breakdown}
      linelistEntry={linelistEntry}
      onViewLinelist={() => onViewLinelist(linelistEntry)}
    />
  );
}

function ServiceChart({ chart, onViewLinelist }) {
  const hasCellColors = chart.data.some((row) => row.color);
  const drillable = Boolean(chart.linelist) && typeof onViewLinelist === "function";
  const handleBarClick = drillable
    ? (datum) => {
        const entry = rowLinelistEntry(chart, datum?.payload ?? datum);
        if (entry) onViewLinelist(entry);
      }
    : undefined;

  if (chart.kind === "line") {
    return (
      <LineChart data={chart.data} margin={{ top: 8, right: 18, left: -8, bottom: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey={chart.categoryKey} {...axisProps} />
        <YAxis {...axisProps} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => fmt(value)} />
        {chart.series.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
        {chart.series.map((series) => (
          <Line
            key={series.key}
            type="monotone"
            dataKey={series.key}
            name={series.label}
            stroke={series.color}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
        ))}
      </LineChart>
    );
  }

  const vertical = chart.orientation === "vertical";
  return (
    <BarChart
      data={chart.data}
      layout={chart.orientation}
      margin={{ top: 8, right: 26, left: 12, bottom: 8 }}
    >
      <CartesianGrid {...gridProps} />
      {vertical ? (
        <>
          <XAxis type="number" {...axisProps} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey={chart.categoryKey}
            width={110}
            tickFormatter={truncateCategory}
            {...axisProps}
          />
        </>
      ) : (
        <>
          <XAxis
            dataKey={chart.categoryKey}
            {...axisProps}
            tickFormatter={categoryTick}
            interval={0}
            angle={-90}
            textAnchor="end"
            height={64}
          />
          <YAxis {...axisProps} allowDecimals={false} />
        </>
      )}
      <Tooltip contentStyle={tooltipStyle} formatter={(value) => fmt(value)} />
      {chart.series.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
      {chart.series.map((series) => (
        <Bar
          key={series.key}
          dataKey={series.key}
          name={series.label}
          fill={series.color}
          radius={vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          onClick={handleBarClick}
          cursor={drillable ? "pointer" : undefined}
        >
          {hasCellColors
            ? chart.data.map((row) => (
                <Cell key={String(row[chart.categoryKey])} fill={row.color || series.color} />
              ))
            : null}
        </Bar>
      ))}
    </BarChart>
  );
}

function ServiceTable({ breakdown, emptyNoun, onViewLinelist }) {
  const [firstColumn] = breakdown.columns;
  const [page, setPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(breakdown.rows.length / BREAKDOWN_PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * BREAKDOWN_PAGE_SIZE;
  const pageRows = breakdown.rows.slice(pageStart, pageStart + BREAKDOWN_PAGE_SIZE);
  
  useEffect(() => {
    setPage(1);
  }, [breakdown]);

  if (breakdown.rows.length === 0) return <TabEmpty noun={emptyNoun} />;

  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {breakdown.columns.map((column) => (
                <th key={column.key} className={column.align === "num" ? "num" : undefined}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, index) => {
              const entry = rowLinelistEntry(breakdown, row);

              return (
              <tr
                key={`${row[firstColumn.key]}-${index}`}
                className={entry ? "data-table__row--drillable" : undefined}
                onClick={entry ? () => onViewLinelist(entry) : undefined}
                onKeyDown={
                  entry
                    ? (event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        onViewLinelist(entry);
                      }
                    : undefined
                }
                tabIndex={entry ? 0 : undefined}
                role={entry ? "button" : undefined}
                aria-label={
                  entry ? `View linelist for ${row[firstColumn.key]}` : undefined
                }
              >
                {breakdown.columns.map((column) => {
                  const cell = row[column.key];
                  if (column.pending) {
                    return (
                      <td key={column.key} className={column.align === "num" ? "num" : undefined}>
                        <span className="ops-pending" aria-label="Not available">
                          {EM_DASH}
                        </span>
                      </td>
                    );
                  }
                  if (column.align === "num") {
                    return (
                      <td key={column.key} className="num">
                        {typeof cell === "number" ? (
                          fmt(cell)
                        ) : (
                          <span className="ops-pending" aria-label="Not available">
                            {EM_DASH}
                          </span>
                        )}
                      </td>
                    );
                  }
                  return (
                    <td key={column.key} className="ops-cell-label" title={cell ?? undefined}>
                      {cell}
                    </td>
                  );
                })}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="ops-breakdown-pager">
        <LinelistPager page={currentPage} totalPages={totalPages} onPage={setPage} />
      </div>
      {breakdown.shown < breakdown.total ? (
        <p className="ops-truncation-note">
          Showing top {fmt(breakdown.shown)} of {fmt(breakdown.total)}.
        </p>
      ) : null}
    </>
  );
}

function DataQualityPanel({ chart }) {
  return (
    <div className="ops-panel">
      <div className="ops-panel__head">
        <h2>{chart.title}</h2>
      </div>
      <div className="data-empty ops-panel-empty" style={{ minHeight: chart.height }}>
        <span className="ops-pending" aria-label="Not available">
          {EM_DASH}
        </span>
      </div>
    </div>
  );
}

function ChartPanel({ chart, emptyNoun, onViewLinelist }) {
  if (isSuppressed(chart)) {
    return <DataQualityPanel chart={chart} />;
  }

  return (
    <div className="ops-panel">
      <div className="ops-panel__head">
        <h2>{chart.title}</h2>
        {chart.subtitle ? <span>{chart.subtitle}</span> : null}
      </div>
      {chart.data.length === 0 ? (
        <div className="data-empty" style={{ minHeight: chart.height }}>
          <EmptyBody noun={emptyNoun} />
        </div>
      ) : (
        <Chart height={chart.height}>
          <ServiceChart chart={chart} onViewLinelist={onViewLinelist} />
        </Chart>
      )}
    </div>
  );
}

function MetricSkeleton({ emphasis }) {
  const important = emphasis === "important";
  return (
    <article className={`ops-metric ops-metric--${important ? "important ops-metric--navy" : "plain"}`}>
      <Skeleton className="ops-skeleton ops-skeleton--label" />
      <Skeleton
        className={`ops-skeleton ${important ? "ops-skeleton--value" : "ops-skeleton--value-plain"}`}
      />
    </article>
  );
}

function TabSkeleton({ activeTab }) {
  const isSummary = activeTab.key === "summary";

  return (
    <section className="ops-service-detail" aria-busy="true" aria-label={`${activeTab.label} detail loading`}>
      {!isSummary ? (
        <div className="ops-detail-head">
          <div>
            <h2>{activeTab.title}</h2>
            <p>{activeTab.description}</p>
          </div>
        </div>
      ) : null}

      {isSummary ? (
        <div className="ops-summary ops-summary--loading">
          <section className="ops-critical-grid" aria-busy="true" aria-label="Operational priorities loading">
            {[0, 1, 2, 3, 4].map((index) => <MetricSkeleton key={index} emphasis="important" />)}
          </section>
          <div className="ops-main-grid">
            {[0, 1].map((index) => (
              <div className="ops-panel" key={index}>
                <div className="ops-panel__head">
                  <h2>Summary chart</h2>
                </div>
                <Skeleton className="ops-skeleton ops-skeleton--chart" style={{ height: 280 }} />
              </div>
            ))}
          </div>
          <div className="ops-panel" aria-busy="true">
            <div className="ops-panel__head">
              <h2>Cases by health facility</h2>
            </div>
            {[0, 1, 2, 3, 4].map((index) => (
              <Skeleton key={index} className="ops-skeleton ops-skeleton--row" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <section className="ops-service-metric-grid" aria-busy="true">
            {[0, 1, 2].map((index) => <MetricSkeleton key={index} emphasis="plain" />)}
          </section>
          <div className="ops-service-detail-grid">
            <div className="ops-panel">
              <div className="ops-panel__head">
                <h2>{activeTab.label} chart</h2>
              </div>
              <Skeleton className="ops-skeleton ops-skeleton--chart" style={{ height: 280 }} />
            </div>
            <div className="ops-panel" aria-busy="true">
              <div className="ops-panel__head">
                <h2>{activeTab.label} detail table</h2>
              </div>
              {[0, 1, 2, 3, 4].map((index) => (
                <Skeleton key={index} className="ops-skeleton ops-skeleton--row" />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function TabError({ activeTab, error, onRetry }) {
  if (error?.status === 401) {
    return (
      <div className="ops-tab-error" role="alert">
        <p>Your session has expired. Sign in again.</p>
        <Link className="btn btn--secondary" href="/login?next=/operational">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="ops-tab-error" role="alert">
      <p>Could not load {activeTab.title} data.</p>
      <button className="btn btn--secondary" type="button" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

function EmptyBody({ noun }) {
  return (
    <div>
      <strong>No records in this selection</strong>
      <p>No {noun} match the current filters. Widen the period or clear a filter.</p>
    </div>
  );
}

function TabEmpty({ noun }) {
  return (
    <div className="data-empty">
      <EmptyBody noun={noun} />
    </div>
  );
}

function isEmptyPayload(payload) {
  const noWindow = !payload.meta?.window?.from && !payload.meta?.window?.to;
  const noRows = (payload.breakdown?.total ?? 0) === 0;
  const noPoints = (payload.charts || []).every((chart) => chart.data.length === 0);
  return noWindow && noRows && noPoints;
}

function DetailHead({ activeTab }) {
  return (
    <div className="ops-detail-head">
      <div>
        <h2>{activeTab.title}</h2>
        <p>{activeTab.description}</p>
      </div>
    </div>
  );
}

function SummaryTab({ activeTab, payload, onViewLinelist }) {
  const importantCards = payload.cards.filter((card) => card.emphasis === "important");
  const plainCards = payload.cards.filter((card) => card.emphasis !== "important");

  if (isEmptyPayload(payload)) {
    return (
      <section className="ops-service-detail" aria-label={`${activeTab.label} detail`}>
        <DetailHead activeTab={activeTab} />
        <TabEmpty noun={activeTab.emptyNoun} />
      </section>
    );
  }

  return (
    <section className="ops-summary" aria-label="Operational summary dashboard">
      <section className="ops-critical-grid" aria-label="Operational priorities">
        {importantCards.map((card) => (
          <MetricCard
            key={card.key}
            card={card}
            tabKey={activeTab.key}
            onViewLinelist={onViewLinelist}
          />
        ))}
      </section>

      {plainCards.length > 0 ? (
        <section className="ops-plain-grid" aria-label="Operational indicators">
          {plainCards.map((card) => (
            <MetricCard
              key={card.key}
              card={card}
              tabKey={activeTab.key}
              onViewLinelist={onViewLinelist}
            />
          ))}
        </section>
      ) : null}

      <section className="ops-main-grid">
        {payload.charts.map((chart) => (
          <ChartPanel key={chart.key} chart={chart} emptyNoun={activeTab.emptyNoun} />
        ))}
      </section>

      {payload.breakdown ? (
        <div className="ops-panel">
          <div className="ops-panel__head">
            <h2>{payload.breakdown.title}</h2>
          </div>
          <ServiceTable breakdown={payload.breakdown} emptyNoun={activeTab.emptyNoun} />
        </div>
      ) : null}
    </section>
  );
}

function ServiceDetailTab({ activeTab, payload, onViewLinelist }) {
  if (isEmptyPayload(payload)) {
    return (
      <section className="ops-service-detail" aria-label={`${activeTab.label} detail`}>
        <DetailHead activeTab={activeTab} />
        <TabEmpty noun={activeTab.emptyNoun} />
      </section>
    );
  }

  return (
    <section className="ops-service-detail" aria-label={`${activeTab.label} detail`}>
      <DetailHead activeTab={activeTab} />

      <section
        className={`ops-service-metric-grid${
          payload.cards.length > 3 ? " ops-service-metric-grid--three-up" : ""
        }`}
        aria-label={`${activeTab.label} indicators`}
      >
        {payload.cards.map((card) => (
          <MetricCard
            key={card.key}
            card={card}
            tabKey={activeTab.key}
            onViewLinelist={onViewLinelist}
          />
        ))}
      </section>

      <div className="ops-service-detail-grid">
        {payload.charts
          .filter((chart) => !chart.fullWidth)
          .map((chart) => (
            <ChartPanel
              key={chart.key}
              chart={chart}
              emptyNoun={activeTab.emptyNoun}
              onViewLinelist={onViewLinelist}
            />
          ))}

        {payload.breakdown ? (
          <div className="ops-panel">
            <div className="ops-panel__head">
              <h2>{payload.breakdown.title}</h2>
            </div>
            <ServiceTable
              breakdown={payload.breakdown}
              emptyNoun={activeTab.emptyNoun}
              onViewLinelist={onViewLinelist}
            />
          </div>
        ) : null}

        {payload.charts
          .filter((chart) => chart.fullWidth)
          .map((chart) => (
            <div className="ops-service-detail-grid__full" key={chart.key}>
              <ChartPanel
                chart={chart}
                emptyNoun={activeTab.emptyNoun}
                onViewLinelist={onViewLinelist}
              />
            </div>
          ))}
      </div>
    </section>
  );
}

function defaultFilterState() {
  return Object.fromEntries(
    Object.entries(FILTER_FIELDS).map(([key, field]) => [
      key,
      DEFAULT_FILTERS[key] || field.allLabel || field.options[0],
    ]),
  );
}

const EMPTY_RANGE = { from: "", to: "" };

export default function OperationalWorkspace() {
  const { isAdmin } = useAuth();
  const [activeTabKey, setActiveTabKey] = useState("summary");
  const [filters, setFilters] = useState(defaultFilterState);
  const [customRange, setCustomRange] = useState(EMPTY_RANGE);
  const [openLinelist, setOpenLinelist] = useState(null);

  const visibleTabs = useMemo(
    () => OPERATIONAL_TABS.filter((tab) => tab.key !== "users" || isAdmin),
    [isAdmin],
  );
  const activeTab = visibleTabs.find((tab) => tab.key === activeTabKey) || visibleTabs[0];

  const tab = useOperationalTab(activeTab.key, filters, customRange);
  const filterOptions = useFilterOptions(activeTab.key);
  const isDataTab = Boolean(TAB_ENDPOINTS[activeTab.key]);
  const refreshing = tab.refreshing;

  const filtersDirty = useMemo(() => {
    const defaults = defaultFilterState();
    return (TAB_FILTERS[activeTab.key] || []).some(
      (key) => filters[key] !== defaults[key],
    );
  }, [activeTab.key, filters]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, []);

  useEffect(() => {
    if (!visibleTabs.some((item) => item.key === activeTabKey)) {
      setActiveTabKey("summary");
    }
  }, [activeTabKey, visibleTabs]);

  useEffect(() => {
    setOpenLinelist(null);
  }, [activeTabKey, filters, customRange]);

  useEffect(() => {
    if (filters.period === CUSTOM_PERIOD_LABEL) return;
    const served = tab.payload?.meta?.window;
    const latest = served?.to;
    if (typeof latest !== "string" || !latest) return;

    const period = PERIOD_OPTIONS[filters.period];
    const span = PERIOD_SPAN_DAYS[period];
    const earliest = period === "all" ? served?.from : shiftIsoDate(latest, -span);
    if (typeof earliest !== "string" || !earliest) return;

    const next = { from: `${earliest}T00:00`, to: `${latest}T23:59` };
    setCustomRange((current) =>
      current.from === next.from && current.to === next.to ? current : next,
    );
  }, [filters.period, tab.payload]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function handleCustomRangeChange(next) {
    setCustomRange((current) =>
      current.from === next.from && current.to === next.to ? current : next,
    );
    setFilters((current) =>
      current.period === CUSTOM_PERIOD_LABEL
        ? current
        : { ...current, period: CUSTOM_PERIOD_LABEL },
    );
  }

  function clearFilters() {
    const defaults = defaultFilterState();
    setFilters((current) => {
      const next = { ...current };
      (TAB_FILTERS[activeTab.key] || []).forEach((key) => {
        next[key] = defaults[key];
      });
      return next;
    });
    setCustomRange(EMPTY_RANGE);
  }

  function handleRefresh() {
    tab.refresh();
  }

  function handleViewLinelist(entry) {
    const tabParams = buildTabParams(activeTab.key, filters, customRange);
    if (!entry || !tabParams) return;
    setOpenLinelist({ entry, tabParams });
  }

  function renderActiveTab() {
    if (activeTab.key === "users") return <UsersManagement embedded />;
    if (tab.status === "error") {
      return <TabError activeTab={activeTab} error={tab.error} onRetry={tab.refresh} />;
    }
    if (tab.status === "loading" || !tab.payload) {
      return <TabSkeleton activeTab={activeTab} />;
    }
    if (activeTab.key === "summary") {
      return (
        <SummaryTab
          activeTab={activeTab}
          payload={tab.payload}
          onViewLinelist={handleViewLinelist}
        />
      );
    }
    return (
      <ServiceDetailTab
        activeTab={activeTab}
        payload={tab.payload}
        onViewLinelist={handleViewLinelist}
      />
    );
  }

  return (
    <main className="ops-page">
      <section className="ops-hero">
        <div className="ops-hero__copy">
          <div>
            <span className="ops-kicker">Restricted operational workspace</span>
            <h1 className="ops-hero__title">
              Operational Dashboard
              <br />
              Staff Workspace
            </h1>
            <p className="ops-hero__meta">Service-point workspaces, data filters and aggregate response queues for EOC teams. Record-level line lists are available to signed-in users.</p>
          </div>
          <div className="hero-tile__actions">
            <p className="hero-tile__asof">
              {formatDataAge(isDataTab ? tab.payload : null)}
            </p>
            <button
              className="btn btn--secondary"
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || !isDataTab}
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      <section className="ops-tab-shell">
        <nav className="ops-nav" aria-label="Operational workspace tabs">
          <div className="tabs ops-view-tabs" role="tablist" aria-label="Operational workspace tabs">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                id={`ops-tab-${tab.key}`}
                type="button"
                role="tab"
                aria-selected={activeTabKey === tab.key}
                aria-controls={`ops-panel-${tab.key}`}
                className={`tab ${activeTabKey === tab.key ? "tab--active" : ""}`}
                onClick={() => setActiveTabKey(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <div
          id={`ops-panel-${activeTab.key}`}
          className="ops-tab-panel"
          role="tabpanel"
          aria-labelledby={`ops-tab-${activeTab.key}`}
        >
          <OperationalTabFilters
            activeTab={activeTab}
            filters={filters}
            onChange={updateFilter}
            customRange={customRange}
            onCustomRangeChange={handleCustomRangeChange}
            options={filterOptions.options}
            optionsLoading={filterOptions.loading}
            filtersDirty={filtersDirty}
            onClear={clearFilters}
          />

          <div
            className="ops-tab-body"
            aria-live="polite"
            aria-busy={refreshing || tab.status === "loading" ? "true" : undefined}
          >
            {renderActiveTab()}
          </div>
        </div>
      </section>

      <LinelistModal
        open={Boolean(openLinelist)}
        onClose={() => setOpenLinelist(null)}
        entry={openLinelist?.entry || null}
        tabParams={openLinelist?.tabParams || null}
      />
    </main>
  );
}
