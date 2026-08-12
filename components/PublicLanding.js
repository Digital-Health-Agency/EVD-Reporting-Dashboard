"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_DISEASE, DISEASES, diseaseByKey } from "@/lib/diseases";
import { fmt, formatLastUpdatedLabel } from "@/lib/format";
import { INDICATOR_TOOLTIPS } from "@/lib/indicator-tooltips";

function MetricIcon({ name }) {
  const paths = {
    cases: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M6 3v5a4 4 0 0 0 8 0V3" />
        <path d="M4 3h3M13 3h3" />
        <path d="M10 12v3a4 4 0 0 0 8 0v-1.2" />
        <circle cx="18" cy="10.5" r="2.2" />
      </svg>
    ),
    tests: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M10 2h4" />
        <path d="M11 2v6l-5 9a3 3 0 0 0 2.6 4.5h6.8A3 3 0 0 0 18 17l-5-9V2" />
        <path d="M8 16h8" />
      </svg>
    ),
    screening: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5 21 21" />
      </svg>
    ),
  };

  return paths[name] || null;
}

function deltaLabel(value) {
  if (!Number.isFinite(value)) return null;
  return `${value < 0 ? "−" : "+"}${fmt(Math.abs(value))}`;
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

function MetricCard({ tone, icon, title, wide, children }) {
  return (
    <article className={`metric-card${wide ? " metric-card--wide" : ""}`} aria-label={title}>
      <header className="metric-card__head">
        <span className={`metric-card__icon metric-card__icon--${tone}`} aria-hidden="true">
          <MetricIcon name={icon} />
        </span>
        <h3>{title}</h3>
      </header>
      {children}
    </article>
  );
}

function MetricBanner({ tone, label, value, delta }) {
  const change = deltaLabel(delta);
  return (
    <div className={`metric-banner metric-banner--${tone}`}>
      <span className="metric-banner__label">{label}</span>
      <strong className="metric-banner__value">{fmt(value)}</strong>
      {change ? <span className="metric-banner__delta">Last 24h: {change}</span> : null}
    </div>
  );
}

function MetricStat({ label, value, tone, description, wide }) {
  return (
    <div
      className={`metric-stat${wide ? " metric-stat--wide" : ""} indicator-tooltip-host`}
      {...tooltipAttrs(description, label)}
    >
      <dt>{label}</dt>
      <dd className={tone ? `metric-stat__value metric-stat__value--${tone}` : "metric-stat__value"}>
        {value}
      </dd>
      <IndicatorBubble text={description} />
    </div>
  );
}

function formatRate(value) {
  if (!Number.isFinite(value)) return "--";
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

function ScreeningTrend({ points }) {
  if (!points.length) return null;
  const peak = Math.max(...points.map((point) => point.screened), 1);
  const lastIndex = points.length - 1;

  return (
    <figure className="metric-trend">
      <figcaption>Daily Screening Trend</figcaption>
      <div className="metric-trend__bars">
        {points.map((point, index) => (
          <div
            className="metric-trend__slot indicator-tooltip-host"
            key={point.date}
            tabIndex={0}
            aria-label={`${point.full}: ${fmt(point.screened)} screened`}
          >
            <span className="indicator-tooltip__bubble indicator-tooltip__bubble--chart" role="tooltip">
              <strong>{fmt(point.screened)}</strong> screened
              <span className="metric-trend__bubble-date">{point.full}</span>
            </span>
            <div className="metric-trend__track">
              <div
                className={`metric-trend__bar${index === lastIndex ? " metric-trend__bar--latest" : ""}`}
                style={{ height: `${Math.max(8, Math.round((point.screened / peak) * 100))}%` }}
              />
            </div>
            <span className="metric-trend__tick">{point.label}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}

const WEEKDAY = { weekday: "short" };
const FULL_DAY = { weekday: "short", day: "numeric", month: "short" };

function screeningTrendPoints(poe) {
  return (poe.trend || [])
    .filter((point) => point && point.date)
    .slice(-14)
    .map((point) => {
      const parsed = new Date(`${point.date}T00:00:00`);
      const valid = !Number.isNaN(parsed.getTime());
      return {
        date: point.date,
        screened: Number.isFinite(point.screened) ? point.screened : 0,
        label: valid ? parsed.toLocaleDateString("en-KE", WEEKDAY) : point.date,
        full: valid ? parsed.toLocaleDateString("en-KE", FULL_DAY) : point.date,
      };
    });
}

function PublicKeyMetrics({ data }) {
  const cases = data?.cases || {};
  const labs = data?.labs || {};
  const poe = data?.poe || {};

  const confirmed = Number.isFinite(cases.confirmed) ? cases.confirmed : 0;
  const deaths = 0;
  const cfr = confirmed > 0 ? (deaths / confirmed) * 100 : 0;
  const screeningPoints = (poe.byPoe || []).filter((point) => !point.unknown).length;

  return (
    <div className="public-key-grid">
      <MetricCard tone="cases" icon="cases" title="Cases">
        <MetricBanner
          tone="cases"
          label="Confirmed"
          value={confirmed}
          delta={cases.newConfirmed24h}
        />
        <dl className="metric-card__stats">
          <MetricStat
            label="Recoveries"
            value={fmt(cases.recoveries)}
            tone="positive"
            description={INDICATOR_TOOLTIPS.recoveries}
          />
          <MetricStat
            label="Deaths"
            value={fmt(deaths)}
            tone="negative"
            description={INDICATOR_TOOLTIPS.deaths}
          />
          <MetricStat
            label="Case Fatality Rate"
            value={formatRate(cfr)}
            tone="warning"
            description={INDICATOR_TOOLTIPS.caseFatalityRate}
            wide
          />
        </dl>
      </MetricCard>

      <MetricCard tone="tests" icon="tests" title="Samples Tested">
        <MetricBanner
          tone="tests"
          label="Total Tested"
          value={labs.testsDone}
          delta={labs.newTested24h}
        />
        <dl className="metric-card__stats">
          <MetricStat
            label="Positive"
            value={fmt(labs.positive)}
            tone="negative"
            description={INDICATOR_TOOLTIPS.positiveTests}
          />
          <MetricStat
            label="Negative"
            value={fmt(labs.negative)}
            tone="positive"
            description={INDICATOR_TOOLTIPS.negativeTests}
          />
        </dl>
      </MetricCard>

      <MetricCard tone="screening" icon="screening" title="Screening" wide>
        <MetricBanner
          tone="screening"
          label="Total Screened"
          value={poe.totalScreened}
          delta={poe.newScreened24h}
        />
        <dl className="metric-card__stats metric-card__stats--split">
          <MetricStat
            label="Screening points"
            value={fmt(screeningPoints)}
            description={INDICATOR_TOOLTIPS.screeningRecords}
          />
          <MetricStat
            label="Contacts listed"
            value={fmt(cases.contactsListed)}
            description={INDICATOR_TOOLTIPS.contactsListed}
          />
        </dl>
        <ScreeningTrend points={screeningTrendPoints(poe)} />
      </MetricCard>
    </div>
  );
}

export default function PublicLanding() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [eventKey, setEventKey] = useState(DEFAULT_DISEASE);
  const reqId = useRef(0);
  const selectedEvent = diseaseByKey(eventKey) || DISEASES[0];

  const load = useCallback((background = false) => {
    const id = ++reqId.current;
    if (background) setRefreshing(true);
    else setStatus("loading");
    fetch("/api/analytics/metrics", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
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

  useEffect(() => {
    load();
  }, [load]);

  const updated = useMemo(() => {
    if (!data?.meta?.lastUpdated) return null;
    return formatLastUpdatedLabel(data.meta.lastUpdated);
  }, [data?.meta?.lastUpdated]);

  return (
    <main className="public-page">
      <section className="public-hero">
        <div className="public-hero__copy">
          <div>
            <p className="public-label">Kenya Surveillance System</p>
            <h1 className="public-hero__title">
              Current Surveillance
              <br />
              Situation Update
            </h1>
            <p className="public-hero__meta">
              Official aggregate figures from Kenya&apos;s national public health surveillance and response systems.
            </p>
          </div>
          <div className="hero-tile__actions">
            <button
              className="btn btn--secondary"
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      <section className="public-event" aria-label="Public health event selection">
        <div className="public-event__copy">
          <label className="public-event__label" htmlFor="public-health-event">
            <strong>Public Health Event</strong>
          </label>
          <p className="public-event__subtitle">
            Choose the outbreak or health event you want to follow. The figures below show the current national update for that event.
          </p>
        </div>
        <select
          id="public-health-event"
          className="public-event__select"
          value={selectedEvent.key}
          onChange={(event) => setEventKey(event.target.value)}
        >
          {DISEASES.map((disease) => (
            <option key={disease.key} value={disease.key}>
              {disease.name}
            </option>
          ))}
        </select>
      </section>

      <section className="public-updates" aria-label={`${selectedEvent.name} updates`}>
        <div className="public-updates__copy">
          <p className="public-updates__label">KNPHI Live Situation Room</p>
          <h2 className="public-updates__title">{selectedEvent.name} Updates</h2>
        </div>
        <p className="public-updates__asof" aria-live="polite">
          <span className="public-updates__dot" aria-hidden="true" />
          {status === "error"
            ? "Unable to load the current update."
            : status !== "ready"
              ? "Loading current figures..."
              : updated
                ? `As of ${updated}`
                : "No surveillance data reported yet."}
        </p>
      </section>

      <section className="public-key-metrics" aria-label="Key public metrics">
        <div className="public-section-head">
          <h2>Key metrics</h2>
          <p>Headline cases, laboratory samples tested, and point-of-entry screening from the current national update.</p>
        </div>
        {status === "ready" ? (
          <PublicKeyMetrics data={data} />
        ) : (
          <div className="public-loading public-loading--block">
            {status === "error" ? "Metrics unavailable" : "Loading metrics..."}
          </div>
        )}
      </section>

      <section className="public-info" aria-label="Public guidance">
        <div className="public-info__col">
          <h2>What to do</h2>
          <ul>
            <li>Report symptoms early — fever, unusual bleeding, or sudden illness.</li>
            <li>Follow official MoH guidance.</li>
            <li>Avoid direct contact with body fluids from anyone who is unwell.</li>
          </ul>
        </div>
        <div className="public-info__col">
          <h2>Help channels</h2>
          <ul>
            <li>Dial <strong>719</strong> for free health support.</li>
            <li>Use official MoH and DHA channels for verified updates.</li>
          </ul>
        </div>
        <div className="public-info__col">
          <h2>Data safety</h2>
          <p>This page shows aggregate indicators only. Operational records remain restricted.</p>
        </div>
      </section>
    </main>
  );
}
