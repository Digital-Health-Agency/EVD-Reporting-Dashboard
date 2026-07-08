"use client";

import { useEffect, useMemo, useState } from "react";
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

const FILTERS = {
  period: ["Last 24h", "Last 7 days", "Last 14 days", "Last 21 days"],
  county: ["National", "Nairobi", "Busia", "Mombasa", "Kajiado", "Turkana"],
  subcounty: ["All subcounties", "Embakasi", "Matayos", "Changamwe", "Kajiado Central", "Turkana West"],
  ward: ["All wards", "Airport", "Busia Township", "Port Reitz", "Namanga", "Lokichogio"],
  facility: ["All facilities", "Kenyatta National Hospital", "Busia County Referral", "Port Health Clinic", "Namanga Health Centre"],
  poe: ["All POEs", "JKIA", "Busia", "Mombasa Port", "Namanga", "Lokichogio"],
};

const FACTOR = {
  period: { "Last 24h": 0.28, "Last 7 days": 0.7, "Last 14 days": 1, "Last 21 days": 1.24 },
  county: { National: 1, Nairobi: 0.42, Busia: 0.31, Mombasa: 0.24, Kajiado: 0.18, Turkana: 0.14 },
};

const SERVICE_PANELS = {
  poe: {
    title: "Points of entry",
    source: "ADaM, UHAI, Ebola CIF, MOH 502",
    indicators: ["Travellers screened", "Secondary-screening alerts", "Suspected cases at POE", "Contacts listed"],
    filters: ["Period", "Point of entry", "Country of origin", "Destination"],
  },
  hf: {
    title: "Health facilities",
    source: "TC EMRs, ADaM CIF, EMRs, civil registries",
    indicators: ["Suspected cases", "New confirmed", "Admissions", "Deaths", "Recoveries", "CFR"],
    filters: ["Period", "County", "Subcounty", "Ward", "Facility"],
  },
  community: {
    title: "Community",
    source: "eCHIS, M-Dharura, EBS Connect, KRCS app",
    indicators: ["Signals generated", "Signals verified", "Signals linked to facilities", "Contacts traced"],
    filters: ["Period", "County", "Subcounty", "Ward"],
  },
  labs: {
    title: "Laboratory",
    source: "ADaM, LIMS, lab registers",
    indicators: ["Tests done", "Positive", "Negative", "Inconclusive", "Pending", "Turnaround time"],
    filters: ["Period", "Lab", "Facility geography", "Sample source"],
  },
  contacts: {
    title: "Contacts",
    source: "Contacts listing form, ADaM",
    indicators: ["Contacts listed", "Follow-up due", "21-day completion", "Symptomatic contacts"],
    filters: ["Period", "County", "Ward", "Follow-up status"],
  },
  actions: {
    title: "EOC actions",
    source: "Incident-management action tracker",
    indicators: ["Open actions", "Blocked actions", "Due today", "Overdue"],
    filters: ["Pillar", "Owner", "Deadline", "Status"],
  },
};

const SERVICE_ORDER = ["poe", "hf", "community", "labs", "contacts", "actions"];
const tooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid #e7ebef" };
const axisProps = { tick: { fontSize: 11, fill: "#69757f" }, axisLine: false, tickLine: false };
const gridProps = { strokeDasharray: "3 3", vertical: false, stroke: "#eef1f4" };

function n(value) {
  return Math.max(0, Math.round(value));
}

function scale(filters) {
  return (
    (FACTOR.period[filters.period] || 1) *
    (FACTOR.county[filters.county] || 1)
  );
}

function buildData(filters) {
  const f = scale(filters);
  const alertsPending = n(24 * f + 3);
  const contactsDue = n(312 * f + 18);
  const labPending = n(38 * f + 6);
  const casesReview = n(47 * f + 5);
  const signals = n(188 * f + 9);
  const verified = n(signals * 0.68);
  const samples = n(104 * f + 8);
  const testsDone = n(296 * f + 18);
  const contactsListed = n(642 * f + 30);
  const followUpDone = n(contactsListed * 0.78);
  const screened = n(28400 * f + 1200);

  const queues = [
    { service: "Cases", open: casesReview, overdue: n(casesReview * 0.18), color: "#b42318" },
    { service: "Contacts", open: contactsDue, overdue: n(contactsDue * 0.12), color: "#1f7a4d" },
    { service: "Laboratory", open: labPending, overdue: n(labPending * 0.24), color: "#b7791f" },
    { service: "POE", open: alertsPending, overdue: n(alertsPending * 0.16), color: "#0369a1" },
    { service: "Community", open: n((signals - verified) * 0.7), overdue: n((signals - verified) * 0.16), color: "#0e6e63" },
    { service: "Actions", open: n(32 * f + 7), overdue: n(5 * f + 2), color: "#64748b" },
  ];

  const daily = Array.from({ length: 7 }, (_, i) => {
    const multiplier = 0.74 + i * 0.07;
    return {
      day: ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"][i],
      Signals: n((signals / 7) * multiplier),
      Verified: n((verified / 7) * multiplier),
      Samples: n((samples / 7) * (0.82 + i * 0.04)),
    };
  });

  const sampleStatus = [
    { name: "Negative", value: n(testsDone * 0.88), color: "#1f7a4d" },
    { name: "Positive", value: n(testsDone * 0.04), color: "#b42318" },
    { name: "Inconclusive", value: n(testsDone * 0.03), color: "#b7791f" },
    { name: "Pending", value: labPending, color: "#64748b" },
  ];

  return {
    alertsPending,
    contactsDue,
    labPending,
    casesReview,
    signals,
    verified,
    samples,
    testsDone,
    contactsListed,
    followUpDone,
    screened,
    queues,
    daily,
    sampleStatus,
    dataQuality: [
      { label: "Missing county or ward", value: n(18 * f + 4), tone: "amber" },
      { label: "Late lab communication", value: n(9 * f + 2), tone: "red" },
      { label: "Duplicate traveller identifiers", value: n(12 * f + 1), tone: "blue" },
      { label: "Pending source reconciliation", value: n(16 * f + 3), tone: "amber" },
    ],
    actions: [
      { task: "Validate POE alert investigations", owner: "Surveillance", due: "Today", status: "Due" },
      { task: "Reconcile pending LIMS results", owner: "Laboratory", due: "Today", status: "Blocked" },
      { task: "Close 21-day contact follow-up gaps", owner: "Contact tracing", due: "Tomorrow", status: "In progress" },
      { task: "Publish county briefing extract", owner: "EOC planning", due: "Today", status: "Ready" },
    ],
  };
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

function LoginGate({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });

  function submit(event) {
    event.preventDefault();
    onLogin(form.email || "preview@dha.go.ke");
  }

  return (
    <main className="locked-page ops-login-page">
      <section className="locked-card ops-login-card">
        <span className="locked-card__label">Restricted access</span>
        <h1>Operational workspace requires sign in</h1>
        <p>Temporary preview gate. Credentials are not validated in this prototype.</p>
        <form className="ops-login-form" onSubmit={submit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>
          <button className="btn btn--primary" type="submit">Sign in</button>
        </form>
      </section>
    </main>
  );
}

function ImportantMetric({ tone, label, value, detail }) {
  return (
    <article className={`ops-metric ops-metric--important ops-metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function PlainMetric({ tone, label, value, detail }) {
  return (
    <article className="ops-metric ops-metric--plain">
      <span>{label}</span>
      <strong className={`is-${tone}`}>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="ops-filter" data-filter={label.toLowerCase()}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function StatusTag({ status }) {
  const key = status.toLowerCase().replace(/\s+/g, "-");
  return <span className={`ops-status ops-status--${key}`}>{status}</span>;
}

export default function OperationalWorkspace() {
  const [user, setUser] = useState(null);
  const [activeService, setActiveService] = useState("poe");
  const [filters, setFilters] = useState({
    period: "Last 14 days",
    county: "National",
    subcounty: "All subcounties",
    ward: "All wards",
    facility: "All facilities",
    poe: "All POEs",
  });

  const data = useMemo(() => buildData(filters), [filters]);
  const active = SERVICE_PANELS[activeService];
  const followPct = data.contactsListed > 0 ? Math.round((data.followUpDone / data.contactsListed) * 100) : 0;
  const verifiedPct = data.signals > 0 ? Math.round((data.verified / data.signals) * 100) : 0;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [user]);

  if (!user) return <LoginGate onLogin={setUser} />;

  return (
    <main className="ops-page">
      <section className="ops-hero">
        <div>
          <span className="ops-kicker">Aggregate operations preview</span>
          <h1>Operational Response Workspace</h1>
          <p>Work queues, filters and data-quality views for EOC teams. No patient or contact line lists are shown.</p>
        </div>
        <button className="btn btn--secondary" type="button" onClick={() => setUser(null)}>Sign out</button>
      </section>

      <section className="ops-filter-panel" aria-label="Operational filters">
        <FilterSelect label="Period" value={filters.period} options={FILTERS.period} onChange={(value) => setFilters((current) => ({ ...current, period: value }))} />
        <FilterSelect label="County" value={filters.county} options={FILTERS.county} onChange={(value) => setFilters((current) => ({ ...current, county: value }))} />
        <FilterSelect label="Subcounty" value={filters.subcounty} options={FILTERS.subcounty} onChange={(value) => setFilters((current) => ({ ...current, subcounty: value }))} />
        <FilterSelect label="Ward" value={filters.ward} options={FILTERS.ward} onChange={(value) => setFilters((current) => ({ ...current, ward: value }))} />
        <FilterSelect label="Facility" value={filters.facility} options={FILTERS.facility} onChange={(value) => setFilters((current) => ({ ...current, facility: value }))} />
        <FilterSelect label="POE" value={filters.poe} options={FILTERS.poe} onChange={(value) => setFilters((current) => ({ ...current, poe: value }))} />
      </section>

      <section className="ops-critical-grid" aria-label="Operational priorities">
        <ImportantMetric tone="red" label="Alerts pending investigation" value={fmt(data.alertsPending)} detail="POE and community signals requiring action" />
        <ImportantMetric tone="navy" label="Contacts due today" value={fmt(data.contactsDue)} detail={`${followPct}% follow-up reached in selected scope`} />
        <ImportantMetric tone="amber" label="Lab results pending" value={fmt(data.labPending)} detail="Samples awaiting final result or communication" />
      </section>

      <section className="ops-plain-grid" aria-label="Operational indicators">
        <PlainMetric tone="blue" label="Travellers screened" value={fmt(data.screened)} detail="No. screened by POE" />
        <PlainMetric tone="red" label="Cases for review" value={fmt(data.casesReview)} detail="Suspected or confirmed case queue" />
        <PlainMetric tone="green" label="Signals verified" value={`${verifiedPct}%`} detail={`${fmt(data.verified)} of ${fmt(data.signals)} generated`} />
        <PlainMetric tone="blue" label="Samples collected" value={fmt(data.samples)} detail="Facility, ward, subcounty, county sources" />
        <PlainMetric tone="green" label="Contacts followed up" value={fmt(data.followUpDone)} detail={`${fmt(data.contactsListed)} listed contacts`} />
        <PlainMetric tone="amber" label="Data quality flags" value={fmt(data.dataQuality.reduce((sum, item) => sum + item.value, 0))} detail="Records needing source cleanup" />
      </section>

      <section className="ops-main-grid">
        <div className="ops-panel">
          <div className="ops-panel__head">
            <h2>Work queue by service point</h2>
            <span>Open and overdue items</span>
          </div>
          <Chart height={320}>
            <BarChart data={data.queues} layout="vertical" margin={{ top: 8, right: 26, left: 12, bottom: 8 }}>
              <CartesianGrid {...gridProps} />
              <XAxis type="number" {...axisProps} allowDecimals={false} />
              <YAxis type="category" dataKey="service" width={82} {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => fmt(value)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="open" name="Open" radius={[0, 4, 4, 0]}>
                {data.queues.map((row) => <Cell key={row.service} fill={row.color} />)}
              </Bar>
              <Bar dataKey="overdue" name="Overdue" fill="#b42318" radius={[0, 4, 4, 0]} />
            </BarChart>
          </Chart>
        </div>

        <div className="ops-panel">
          <div className="ops-panel__head">
            <h2>Daily signal and sample flow</h2>
            <span>Signals, verified signals and samples</span>
          </div>
          <Chart height={320}>
            <LineChart data={data.daily} margin={{ top: 8, right: 18, left: -8, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="day" {...axisProps} />
              <YAxis {...axisProps} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => fmt(value)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Signals" stroke="#0369a1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Verified" stroke="#1f7a4d" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Samples" stroke="#b7791f" strokeWidth={2} dot={false} />
            </LineChart>
          </Chart>
        </div>

        <div className="ops-panel ops-panel--wide">
          <div className="ops-panel__head">
            <h2>Service-point indicator drilldown</h2>
            <span>{active.source}</span>
          </div>
          <div className="ops-service-tabs" role="tablist" aria-label="Service point drilldown">
            {SERVICE_ORDER.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeService === key}
                className={activeService === key ? "is-active" : ""}
                onClick={() => setActiveService(key)}
              >
                {SERVICE_PANELS[key].title}
              </button>
            ))}
          </div>
          <div className="ops-drill-grid">
            <div>
              <h3>{active.title}</h3>
              <ul className="ops-chip-list">
                {active.indicators.map((indicator) => <li key={indicator}>{indicator}</li>)}
              </ul>
            </div>
            <div>
              <h3>Useful filters</h3>
              <ul className="ops-chip-list ops-chip-list--muted">
                {active.filters.map((filter) => <li key={filter}>{filter}</li>)}
              </ul>
            </div>
          </div>
        </div>

        <div className="ops-panel">
          <div className="ops-panel__head">
            <h2>Sample result status</h2>
            <span>Direct status comparison</span>
          </div>
          <Chart height={280}>
            <BarChart data={data.sampleStatus} layout="vertical" margin={{ top: 8, right: 24, left: 18, bottom: 8 }}>
              <CartesianGrid {...gridProps} />
              <XAxis type="number" {...axisProps} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={92} {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => fmt(value)} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.sampleStatus.map((row) => <Cell key={row.name} fill={row.color} />)}
              </Bar>
            </BarChart>
          </Chart>
        </div>

        <div className="ops-panel">
          <div className="ops-panel__head">
            <h2>Data quality flags</h2>
            <span>Source records needing cleanup</span>
          </div>
          <ul className="ops-quality-list">
            {data.dataQuality.map((item) => (
              <li key={item.label}>
                <span>{item.label}</span>
                <strong className={`is-${item.tone}`}>{fmt(item.value)}</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="ops-panel ops-panel--wide">
          <div className="ops-panel__head">
            <h2>EOC action tracker</h2>
            <span>Owners, timelines and blockers</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Owner</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.actions.map((action) => (
                  <tr key={action.task}>
                    <td>{action.task}</td>
                    <td>{action.owner}</td>
                    <td>{action.due}</td>
                    <td><StatusTag status={action.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
