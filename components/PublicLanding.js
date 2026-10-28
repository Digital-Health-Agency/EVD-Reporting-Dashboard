"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_DISEASE, DISEASES, diseaseByKey } from "@/lib/diseases";
import { fmt, formatAsOfNow } from "@/lib/format";
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
    deaths: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M8.5 2h7l4 5.5L16 22H8L4.5 7.5Z" strokeLinejoin="round" />
      </svg>
    ),
    contacts: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M15.5 14.2A4.5 4.5 0 0 1 21 18.5" />
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

const TREND_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY = { weekday: "short", timeZone: "UTC" };
const DAY_NUMBER = { day: "numeric", timeZone: "UTC" };
const FULL_DAY = { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" };
const SHORT_DAY = { day: "numeric", month: "short", timeZone: "UTC" };

function parseDay(value) {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

// The last 14 calendar days ending on `endDate`, one point per day. Days the
// series does not report are zero, so a quiet source shows as quiet.
function dailyTrendPoints(series, endDate, pick) {
  const end = endDate ? parseDay(endDate) : null;
  if (!end) return [];

  const values = new Map();
  for (const point of series || []) {
    if (!point?.date) continue;
    const picked = pick(point);
    values.set(point.date, {
      value: Number.isFinite(picked.value) ? picked.value : 0,
      extra: Number.isFinite(picked.extra) ? picked.extra : 0,
    });
  }

  const points = [];
  for (let offset = TREND_DAYS - 1; offset >= 0; offset -= 1) {
    const day = new Date(end.getTime() - offset * DAY_MS);
    const key = dayKey(day);
    const entry = values.get(key) || { value: 0, extra: 0 };
    points.push({
      date: key,
      value: entry.value,
      extra: entry.extra,
      weekday: day.toLocaleDateString("en-KE", WEEKDAY),
      dayNumber: day.toLocaleDateString("en-KE", DAY_NUMBER),
      full: day.toLocaleDateString("en-KE", FULL_DAY),
    });
  }
  return points;
}

function rangeLabel(points) {
  if (!points.length) return "";
  const first = parseDay(points[0].date).toLocaleDateString("en-KE", SHORT_DAY);
  const last = parseDay(points[points.length - 1].date).toLocaleDateString("en-KE", SHORT_DAY);
  return `${first} – ${last}`;
}

function DailyTrend({ title, tone, points, noun, extraNoun }) {
  if (!points.length) return null;
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const peak = Math.max(...points.map((point) => point.value), 1);
  const lastIndex = points.length - 1;

  return (
    <figure className={`metric-trend metric-trend--${tone}`}>
      <figcaption>
        {title} · Last 14 days
        <span className="metric-trend__range">{rangeLabel(points)}</span>
      </figcaption>
      {total === 0 ? (
        <p className="metric-trend__empty">No new {noun} in the last 14 days.</p>
      ) : (
        <div className="metric-trend__bars">
          {points.map((point, index) => (
            <div
              className="metric-trend__slot indicator-tooltip-host"
              key={point.date}
              tabIndex={0}
              aria-label={`${point.full}: ${fmt(point.value)} ${noun}`}
            >
              <span className="indicator-tooltip__bubble indicator-tooltip__bubble--chart" role="tooltip">
                <strong>{fmt(point.value)}</strong> {noun}
                {extraNoun ? ` · ${fmt(point.extra)} ${extraNoun}` : null}
                <span className="metric-trend__bubble-date">{point.full}</span>
              </span>
              <div className="metric-trend__track">
                <div
                  className={`metric-trend__bar${index === lastIndex ? " metric-trend__bar--latest" : ""}`}
                  style={{ height: point.value > 0 ? `${Math.max(4, Math.round((point.value / peak) * 100))}%` : 0 }}
                />
              </div>
              <span className="metric-trend__tick">
                {point.weekday}
                <span className="metric-trend__tick-date">{point.dayNumber}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </figure>
  );
}

function PublicKeyMetrics({ data }) {
  const cases = data?.cases || {};
  const labs = data?.labs || {};
  const poe = data?.poe || {};

  const confirmed = Number.isFinite(cases.confirmed) ? cases.confirmed : 0;
  const deaths = Number.isFinite(cases.deaths) ? cases.deaths : 0;
  const cfr = confirmed > 0 ? (deaths / confirmed) * 100 : 0;
  const screeningPoints = Number.isFinite(poe.screeningPoints) ? poe.screeningPoints : (poe.byPoe || []).filter((point) => !point.unknown).length;

  // The backend's daily series ends today in Nairobi; anchor every chart there.
  const daily = cases.daily || [];
  const screeningDays = (poe.trend || []).filter((point) => point?.date);
  const today = daily.length
    ? daily[daily.length - 1].date
    : screeningDays.length ? screeningDays[screeningDays.length - 1].date : null;
  const caseTrend = dailyTrendPoints(daily, today, (point) => ({ value: point.cases, extra: point.confirmed }));
  const peopleTrend = dailyTrendPoints(labs.daily, today, (point) => ({ value: point.people, extra: point.peoplePositive }));
  const deathTrend = dailyTrendPoints(daily, today, (point) => ({ value: point.deaths }));
  const contactTrend = dailyTrendPoints(daily, today, (point) => ({ value: point.contacts }));
  const screeningTrend = dailyTrendPoints(poe.trend, today, (point) => ({ value: point.screened }));

  return (
    <div className="public-key-grid">
      <MetricCard tone="cases" icon="cases" title="Cases">
        <MetricBanner
          tone="cases"
          label="Confirmed"
          value={confirmed}
          delta={cases.newConfirmed24h}
        />
        <DailyTrend
          title="Daily Cases Reported"
          tone="cases"
          points={caseTrend}
          noun="cases"
          extraNoun="confirmed"
        />
      </MetricCard>

      <MetricCard tone="tests" icon="tests" title="People Tested">
        <MetricBanner
          tone="tests"
          label="People Tested"
          value={labs.patientsTested}
          delta={labs.newPatientsTested24h}
        />
        <dl className="metric-card__stats">
          <MetricStat
            label="Positive"
            value={fmt(labs.patientsPositive)}
            tone="negative"
            description={INDICATOR_TOOLTIPS.positivePeople}
            wide
          />
        </dl>
        <DailyTrend
          title="Daily People Tested"
          tone="tests"
          points={peopleTrend}
          noun="people tested"
          extraNoun="positive"
        />
      </MetricCard>

      <MetricCard tone="deaths" icon="deaths" title="Deaths">
        <MetricBanner
          tone="deaths"
          label="Deaths"
          value={deaths}
          delta={cases.newDeaths24h}
        />
        <dl className="metric-card__stats">
          <MetricStat
            label="Case Fatality Rate"
            value={formatRate(cfr)}
            tone="warning"
            description={INDICATOR_TOOLTIPS.caseFatalityRate}
            wide
          />
        </dl>
        <DailyTrend title="Daily Deaths" tone="deaths" points={deathTrend} noun="deaths" />
      </MetricCard>

      <MetricCard tone="contacts" icon="contacts" title="Contacts Listed">
        <MetricBanner
          tone="contacts"
          label="Contacts listed"
          value={cases.contactsListed}
          delta={cases.newContacts24h}
        />
        <DailyTrend title="Daily Contacts Listed" tone="contacts" points={contactTrend} noun="contacts" />
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
        </dl>
        <DailyTrend title="Daily Screening" tone="screening" points={screeningTrend} noun="screened" />
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

  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const updated = useMemo(() => (now ? formatAsOfNow(now) : null), [now]);

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
          <p>Headline cases, people tested, deaths, contacts listed, and point-of-entry screening from the current national update.</p>
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
