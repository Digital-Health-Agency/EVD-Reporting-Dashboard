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

const FILTER_FIELDS = {
  period: { label: "Period", options: ["Last 24h", "Last 7 days", "Last 14 days", "Last 21 days"] },
  county: { label: "County", options: ["National", "Nairobi", "Busia", "Mombasa", "Kajiado", "Turkana"] },
  subcounty: { label: "Subcounty", options: ["All subcounties", "Embakasi", "Matayos", "Changamwe", "Kajiado Central", "Turkana West"] },
  ward: { label: "Ward", options: ["All wards", "Airport", "Busia Township", "Port Reitz", "Namanga", "Lokichogio"] },
  facility: { label: "Facility", options: ["All facilities", "Kenyatta National Hospital", "Busia County Referral", "Port Health Clinic", "Namanga Health Centre"] },
  poe: { label: "POE", options: ["All POEs", "JKIA", "Busia", "Mombasa Port", "Namanga", "Lokichogio"] },
  lab: { label: "Lab", options: ["All labs", "National Public Health Laboratory", "KEMRI Nairobi", "Coast Regional Lab", "Busia PCR Node"] },
  resultStatus: { label: "Result status", options: ["All results", "Positive", "Negative", "Inconclusive", "Pending"] },
  sampleSource: { label: "Sample source", options: ["All sources", "Health facility", "POE", "Community alert", "Contact follow-up"] },
  countryOrigin: { label: "Origin", options: ["All origins", "Kenya", "Uganda", "Tanzania", "DRC", "Other"] },
  destination: { label: "Destination", options: ["All destinations", "Nairobi", "Mombasa", "Busia", "Kajiado", "Turkana"] },
  alertStatus: { label: "Alert status", options: ["All alerts", "Pending investigation", "Under investigation", "Closed", "Escalated"] },
  caseStatus: { label: "Case status", options: ["All cases", "Suspected", "Confirmed", "Admitted", "Discharged", "Deceased"] },
  signalStatus: { label: "Signal status", options: ["All signals", "Generated", "Verified", "Linked to facility", "Discarded"] },
  communitySource: { label: "Source", options: ["All sources", "eCHIS", "M-Dharura", "EBS Connect", "KRCS app"] },
  followUpStatus: { label: "Follow-up", options: ["All follow-up", "Due today", "Reached", "Missed", "Completed 21 days", "Symptomatic"] },
  riskLevel: { label: "Risk level", options: ["All risk levels", "High", "Medium", "Low"] },
  pillar: { label: "Pillar", options: ["All pillars", "Surveillance", "Laboratory", "Case management", "POE", "Coordination"] },
  owner: { label: "Owner", options: ["All owners", "Surveillance", "Laboratory", "Contact tracing", "EOC planning", "Port health"] },
  deadline: { label: "Deadline", options: ["All deadlines", "Today", "Tomorrow", "This week", "Overdue"] },
  actionStatus: { label: "Status", options: ["All statuses", "Due", "Blocked", "In progress", "Ready"] },
  priority: { label: "Priority", options: ["All priorities", "High", "Medium", "Routine"] },
};

const TAB_FILTERS = {
  summary: ["period", "county", "subcounty", "ward", "facility", "poe"],
  labs: ["period", "county", "facility", "lab", "resultStatus", "sampleSource"],
  poe: ["period", "poe", "countryOrigin", "destination", "alertStatus"],
  hf: ["period", "county", "subcounty", "ward", "facility", "caseStatus"],
  community: ["period", "county", "subcounty", "ward", "signalStatus", "communitySource"],
  contacts: ["period", "county", "ward", "followUpStatus", "riskLevel"],
  actions: ["pillar", "owner", "deadline", "actionStatus", "priority"],
};

const OPERATIONAL_TABS = [
  {
    key: "summary",
    label: "Summary",
    title: "Operational summary",
    source: "Aggregate preview across response pillars",
    cadence: "Daily and near real-time queues",
    description: "Cross-service workload, alerts, data quality and action status for the EOC.",
  },
  {
    key: "labs",
    label: "Laboratory",
    title: "Laboratory",
    source: "ADaM, LIMS, lab registers",
    cadence: "Daily and result-event updates",
    description: "Sample flow, result status, turnaround time and pending communication queues.",
  },
  {
    key: "poe",
    label: "POE",
    title: "Points of entry",
    source: "ADaM, UHAI, Ebola CIF, MOH 502",
    cadence: "Near real-time where available",
    description: "Traveller screening, secondary-screening alerts, suspected cases and contacts listed at ports of entry.",
  },
  {
    key: "hf",
    label: "Health facilities",
    title: "Health facilities",
    source: "TC EMRs, ADaM CIF, EMRs, civil registries",
    cadence: "Daily or cumulative",
    description: "Suspected cases, confirmations, admissions, outcomes, facility queues and CFR context.",
  },
  {
    key: "community",
    label: "Community",
    title: "Community",
    source: "eCHIS, M-Dharura, EBS Connect, KRCS app",
    cadence: "Daily where applicable",
    description: "Community signals generated, verified, linked to facilities and escalated for response.",
  },
  {
    key: "contacts",
    label: "Contacts",
    title: "Contacts",
    source: "Contacts listing form, ADaM",
    cadence: "Daily follow-up cycle",
    description: "Contacts listed, reached, missed, symptomatic and progressing through the 21-day follow-up window.",
  },
  {
    key: "actions",
    label: "EOC actions",
    title: "EOC actions",
    source: "Incident-management action tracker",
    cadence: "Live action-owner updates",
    description: "Owner, priority, blocker and deadline status for response coordination tasks.",
  },
];

const FACTOR = {
  period: { "Last 24h": 0.28, "Last 7 days": 0.7, "Last 14 days": 1, "Last 21 days": 1.24 },
  county: { National: 1, Nairobi: 0.42, Busia: 0.31, Mombasa: 0.24, Kajiado: 0.18, Turkana: 0.14 },
};

const tooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid #e7ebef" };
const axisProps = { tick: { fontSize: 11, fill: "#69757f" }, axisLine: false, tickLine: false };
const gridProps = { strokeDasharray: "3 3", vertical: false, stroke: "#eef1f4" };
const DEFAULT_FILTERS = {
  period: "Last 14 days",
};

function n(value) {
  return Math.max(0, Math.round(value));
}

function selected(value, allLabel) {
  return value && value !== allLabel;
}

function scale(filters) {
  let value = (FACTOR.period[filters.period] || 1) * (FACTOR.county[filters.county] || 1);
  if (selected(filters.subcounty, "All subcounties")) value *= 0.68;
  if (selected(filters.ward, "All wards")) value *= 0.52;
  if (selected(filters.facility, "All facilities")) value *= 0.44;
  if (selected(filters.poe, "All POEs")) value *= 0.35;
  if (selected(filters.lab, "All labs")) value *= 0.54;
  if (selected(filters.resultStatus, "All results")) value *= 0.62;
  if (selected(filters.alertStatus, "All alerts")) value *= 0.58;
  if (selected(filters.caseStatus, "All cases")) value *= 0.6;
  if (selected(filters.signalStatus, "All signals")) value *= 0.64;
  if (selected(filters.followUpStatus, "All follow-up")) value *= 0.56;
  if (selected(filters.riskLevel, "All risk levels")) value *= filters.riskLevel === "High" ? 0.36 : 0.7;
  if (selected(filters.actionStatus, "All statuses")) value *= 0.72;
  if (selected(filters.priority, "All priorities")) value *= filters.priority === "High" ? 0.4 : 0.78;
  return value;
}

function serviceRows(total, labels, keys) {
  const weights = labels.map((_, index) => 1.25 - index * 0.08);
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  return labels.map((label, index) => {
    const base = n((total * weights[index]) / weightSum);
    return keys.reduce((row, key, keyIndex) => {
      row[key] = keyIndex === 0 ? base : n(base * (0.14 + keyIndex * 0.11));
      return row;
    }, { name: label });
  });
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
  const openActions = n(32 * f + 7);

  const queues = [
    { service: "Cases", open: casesReview, overdue: n(casesReview * 0.18), color: "#b42318" },
    { service: "Contacts", open: contactsDue, overdue: n(contactsDue * 0.12), color: "#1f7a4d" },
    { service: "Laboratory", open: labPending, overdue: n(labPending * 0.24), color: "#b7791f" },
    { service: "POE", open: alertsPending, overdue: n(alertsPending * 0.16), color: "#0369a1" },
    { service: "Community", open: n((signals - verified) * 0.7), overdue: n((signals - verified) * 0.16), color: "#0e6e63" },
    { service: "Actions", open: openActions, overdue: n(openActions * 0.19), color: "#64748b" },
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

  const labRows = serviceRows(testsDone, ["NPHL", "KEMRI Nairobi", "Coast Regional Lab", "Busia PCR Node"], ["tests", "pending", "positive"])
    .map((row, index) => ({ ...row, tat: `${(1.1 + index * 0.3).toFixed(1)}d` }));
  const poeRows = serviceRows(screened, ["JKIA", "Busia", "Mombasa Port", "Namanga", "Lokichogio"], ["screened", "alerts", "suspected"])
    .map((row) => ({ ...row, contacts: n(row.alerts * 1.7) }));
  const facilityRows = serviceRows(casesReview + contactsDue, ["Kenyatta National Hospital", "Busia County Referral", "Port Health Clinic", "Namanga Health Centre"], ["suspected", "confirmed", "admitted"])
    .map((row) => ({ ...row, deaths: n(row.confirmed * 0.18) }));
  const communityRows = serviceRows(signals, ["Nairobi", "Busia", "Mombasa", "Kajiado", "Turkana"], ["generated", "verified", "linked"])
    .map((row) => ({ ...row, traced: n(row.verified * 1.45) }));
  const contactRows = serviceRows(contactsListed, ["Nairobi", "Busia", "Mombasa", "Kajiado", "Turkana"], ["listed", "missed", "symptomatic"])
    .map((row) => ({ ...row, followed: n(row.listed * 0.78), completePct: `${Math.min(99, 62 + row.name.length)}%` }));
  const actionRows = [
    { task: "Validate POE alert investigations", owner: "Surveillance", due: "Today", priority: "High", status: "Due" },
    { task: "Reconcile pending LIMS results", owner: "Laboratory", due: "Today", priority: "High", status: "Blocked" },
    { task: "Close 21-day contact follow-up gaps", owner: "Contact tracing", due: "Tomorrow", priority: "Medium", status: "In progress" },
    { task: "Publish county briefing extract", owner: "EOC planning", due: "Today", priority: "Medium", status: "Ready" },
    { task: "Confirm county IPC stock position", owner: "Case management", due: "This week", priority: "Routine", status: "In progress" },
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
    openActions,
    queues,
    daily,
    sampleStatus,
    labRows,
    poeRows,
    facilityRows,
    communityRows,
    contactRows,
    actionRows,
    dataQuality: [
      { label: "Missing county or ward", value: n(18 * f + 4), tone: "amber" },
      { label: "Late lab communication", value: n(9 * f + 2), tone: "red" },
      { label: "Duplicate traveller identifiers", value: n(12 * f + 1), tone: "blue" },
      { label: "Pending source reconciliation", value: n(16 * f + 3), tone: "amber" },
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
        <p>Temporary preview gate. Any email and password can enter this prototype.</p>
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

function FilterSelect({ fieldKey, value, onChange }) {
  const field = FILTER_FIELDS[fieldKey];
  return (
    <label className="ops-filter" data-filter={field.label.toLowerCase()}>
      <span>{field.label}</span>
      <select value={value} onChange={(event) => onChange(fieldKey, event.target.value)}>
        {field.options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function OperationalTabFilters({ activeTab, filters, onChange }) {
  return (
    <section className="ops-tab-filter-panel" aria-label={`${activeTab.label} data filters`}>
      {TAB_FILTERS[activeTab.key].map((fieldKey) => (
        <FilterSelect
          key={`${activeTab.key}-${fieldKey}`}
          fieldKey={fieldKey}
          value={filters[fieldKey]}
          onChange={onChange}
        />
      ))}
    </section>
  );
}

function StatusTag({ status }) {
  const key = status.toLowerCase().replace(/\s+/g, "-");
  return <span className={`ops-status ops-status--${key}`}>{status}</span>;
}

function SummaryTab({ data }) {
  const followPct = data.contactsListed > 0 ? Math.round((data.followUpDone / data.contactsListed) * 100) : 0;
  const verifiedPct = data.signals > 0 ? Math.round((data.verified / data.signals) * 100) : 0;

  return (
    <>
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

        <DataQualityPanel data={data} />
        <ActionTrackerPanel actions={data.actionRows.slice(0, 4)} />
      </section>
    </>
  );
}

function DataQualityPanel({ data }) {
  return (
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
  );
}

function ActionTrackerPanel({ actions }) {
  return (
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
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((action) => (
              <tr key={action.task}>
                <td>{action.task}</td>
                <td>{action.owner}</td>
                <td>{action.due}</td>
                <td>{action.priority}</td>
                <td><StatusTag status={action.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getServiceContent(key, data) {
  const followPct = data.contactsListed > 0 ? Math.round((data.followUpDone / data.contactsListed) * 100) : 0;
  const verifiedPct = data.signals > 0 ? Math.round((data.verified / data.signals) * 100) : 0;
  const content = {
    labs: {
      metrics: [
        ["blue", "Tests done", fmt(data.testsDone), "All sample outcomes"],
        ["amber", "Pending results", fmt(data.labPending), "Awaiting final result or communication"],
        ["red", "Positive tests", fmt(data.sampleStatus[1].value), "Confirmed from tested samples"],
        ["blue", "Avg turnaround", "1.6d", "Collection to communication"],
      ],
      rows: data.labRows,
      chart: "sampleStatus",
      rowColumns: [
        ["Lab", "name"],
        ["Tests", "tests", "num"],
        ["Pending", "pending", "num"],
        ["Positive", "positive", "num"],
        ["Avg TAT", "tat", "num"],
      ],
      notes: ["Confirm pending result communication daily.", "Escalate late specimens and missing collection dates."],
    },
    poe: {
      metrics: [
        ["green", "Travellers screened", fmt(data.screened), "All selected points of entry"],
        ["amber", "Secondary alerts", fmt(data.alertsPending), "Pending or under investigation"],
        ["red", "Suspected at POE", fmt(n(data.alertsPending * 0.32)), "Requires case-investigation handoff"],
        ["blue", "Contacts listed", fmt(n(data.alertsPending * 1.7)), "From POE screening alerts"],
      ],
      rows: data.poeRows,
      chart: "poeRows",
      rowColumns: [
        ["Point of entry", "name"],
        ["Screened", "screened", "num"],
        ["Alerts", "alerts", "num"],
        ["Suspected", "suspected", "num"],
        ["Contacts", "contacts", "num"],
      ],
      notes: ["Prioritise high-alert POEs for daily investigation review.", "Reconcile traveller identifiers before export."],
    },
    hf: {
      metrics: [
        ["red", "Cases for review", fmt(data.casesReview), "Suspected and confirmed facility queue"],
        ["blue", "Currently admitted", fmt(n(data.casesReview * 0.42)), "Active clinical-management burden"],
        ["green", "Recoveries", fmt(n(data.casesReview * 0.22)), "Reported through facility sources"],
        ["amber", "CFR watch", `${Math.max(0, Math.min(100, n(data.casesReview * 0.08)))}%`, "Derived from confirmed outcomes"],
      ],
      rows: data.facilityRows,
      chart: "facilityRows",
      rowColumns: [
        ["Facility", "name"],
        ["Suspected", "suspected", "num"],
        ["Confirmed", "confirmed", "num"],
        ["Admitted", "admitted", "num"],
        ["Deaths", "deaths", "num"],
      ],
      notes: ["Review admission and outcome reconciliation before executive briefings.", "Keep facility-level records restricted to authenticated users."],
    },
    community: {
      metrics: [
        ["blue", "Signals generated", fmt(data.signals), "CHP and community source reports"],
        ["green", "Signals verified", `${verifiedPct}%`, `${fmt(data.verified)} verified signals`],
        ["amber", "Unlinked signals", fmt(Math.max(0, data.signals - data.verified)), "Needs facility or county linkage"],
        ["green", "Contacts traced", fmt(n(data.verified * 1.45)), "Community tracing activity"],
      ],
      rows: data.communityRows,
      chart: "communityRows",
      rowColumns: [
        ["County", "name"],
        ["Generated", "generated", "num"],
        ["Verified", "verified", "num"],
        ["Linked", "linked", "num"],
        ["Traced", "traced", "num"],
      ],
      notes: ["Watch verification lag by county.", "Escalate verified signals without a linked facility."],
    },
    contacts: {
      metrics: [
        ["blue", "Contacts listed", fmt(data.contactsListed), "All selected scope"],
        ["navy", "Due today", fmt(data.contactsDue), "Follow-up calls or visits due"],
        ["green", "Reached", `${followPct}%`, `${fmt(data.followUpDone)} followed up`],
        ["red", "Symptomatic contacts", fmt(n(data.contactsDue * 0.07)), "Requires case-investigation review"],
      ],
      rows: data.contactRows,
      chart: "contactRows",
      rowColumns: [
        ["County", "name"],
        ["Listed", "listed", "num"],
        ["Followed", "followed", "num"],
        ["Missed", "missed", "num"],
        ["Symptomatic", "symptomatic", "num"],
        ["21-day", "completePct", "num"],
      ],
      notes: ["Prioritise missed high-risk contacts first.", "Close 21-day follow-up only after source reconciliation."],
    },
    actions: {
      metrics: [
        ["blue", "Open actions", fmt(data.openActions), "All response pillars"],
        ["red", "Blocked", fmt(data.actionRows.filter((row) => row.status === "Blocked").length), "Needs EOC escalation"],
        ["amber", "Due today", fmt(data.actionRows.filter((row) => row.due === "Today").length), "Owner follow-up required"],
        ["green", "Ready", fmt(data.actionRows.filter((row) => row.status === "Ready").length), "Prepared for closure or publication"],
      ],
      rows: data.actionRows,
      chart: "actions",
      rowColumns: [
        ["Action", "task"],
        ["Owner", "owner"],
        ["Due", "due"],
        ["Priority", "priority"],
        ["Status", "status"],
      ],
      notes: ["Keep blockers visible until owners clear them.", "Review high-priority actions during EOC check-in."],
    },
  };
  return content[key];
}

function ServiceChart({ kind, data }) {
  if (kind === "sampleStatus") {
    return (
      <BarChart data={data.sampleStatus} layout="vertical" margin={{ top: 8, right: 24, left: 18, bottom: 8 }}>
        <CartesianGrid {...gridProps} />
        <XAxis type="number" {...axisProps} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={92} {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => fmt(value)} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.sampleStatus.map((row) => <Cell key={row.name} fill={row.color} />)}
        </Bar>
      </BarChart>
    );
  }

  const chartMap = {
    poeRows: { rows: data.poeRows, value: "alerts", label: "POE alerts", color: "#0369a1" },
    facilityRows: { rows: data.facilityRows, value: "suspected", label: "Suspected cases", color: "#b42318" },
    communityRows: { rows: data.communityRows, value: "verified", label: "Verified signals", color: "#0e6e63" },
    contactRows: { rows: data.contactRows, value: "missed", label: "Missed follow-ups", color: "#b7791f" },
    actions: { rows: data.actionRows.map((row, index) => ({ name: row.owner, value: index + 1 })), value: "value", label: "Open actions", color: "#64748b" },
  };
  const config = chartMap[kind];
  return (
    <BarChart data={config.rows} layout="vertical" margin={{ top: 8, right: 26, left: 12, bottom: 8 }}>
      <CartesianGrid {...gridProps} />
      <XAxis type="number" {...axisProps} allowDecimals={false} />
      <YAxis type="category" dataKey="name" width={110} {...axisProps} />
      <Tooltip contentStyle={tooltipStyle} formatter={(value) => fmt(value)} />
      <Bar dataKey={config.value} name={config.label} fill={config.color} radius={[0, 4, 4, 0]} />
    </BarChart>
  );
}

function ServiceTable({ rows, columns }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(([label]) => <th key={label}>{label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name || row.task}>
              {columns.map(([label, key, align]) => (
                <td key={label} className={align === "num" ? "num" : undefined}>
                  {typeof row[key] === "number" ? fmt(row[key]) : row[key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ServiceDetailTab({ activeTab, data }) {
  const content = getServiceContent(activeTab.key, data);

  return (
    <section className="ops-service-detail" aria-label={`${activeTab.label} detail`}>
      <div className="ops-detail-head">
        <div>
          <span>{activeTab.cadence}</span>
          <h2>{activeTab.title}</h2>
          <p>{activeTab.description}</p>
        </div>
        <div className="ops-source-card">
          <span>Source</span>
          <strong>{activeTab.source}</strong>
        </div>
      </div>

      <section className="ops-service-metric-grid" aria-label={`${activeTab.label} indicators`}>
        {content.metrics.map(([tone, label, value, detail]) => (
          <PlainMetric key={label} tone={tone} label={label} value={value} detail={detail} />
        ))}
      </section>

      <div className="ops-service-detail-grid">
        <div className="ops-panel">
          <div className="ops-panel__head">
            <h2>{activeTab.label} chart</h2>
            <span>Filtered aggregate view</span>
          </div>
          <Chart height={300}>
            <ServiceChart kind={content.chart} data={data} />
          </Chart>
        </div>

        <div className="ops-panel">
          <div className="ops-panel__head">
            <h2>{activeTab.label} detail table</h2>
            <span>Exact aggregate values</span>
          </div>
          <ServiceTable rows={content.rows} columns={content.rowColumns} />
        </div>

        <div className="ops-panel ops-panel--wide">
          <div className="ops-panel__head">
            <h2>Operational checks</h2>
            <span>What teams should review in this tab</span>
          </div>
          <ul className="ops-quality-list">
            {content.notes.map((note) => (
              <li key={note}>
                <span>{note}</span>
                <strong className="is-blue">Review</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function OperationalWorkspace() {
  const [user, setUser] = useState(null);
  const [activeTabKey, setActiveTabKey] = useState("summary");
  const [filters, setFilters] = useState(() =>
    Object.fromEntries(
      Object.entries(FILTER_FIELDS).map(([key, field]) => [key, DEFAULT_FILTERS[key] || field.options[0]])
    )
  );

  const data = useMemo(() => buildData(filters), [filters]);
  const activeTab = OPERATIONAL_TABS.find((tab) => tab.key === activeTabKey) || OPERATIONAL_TABS[0];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [user]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  if (!user) return <LoginGate onLogin={setUser} />;

  return (
    <main className="ops-page">
      <section className="ops-hero">
        <div>
          <span className="ops-kicker">Aggregate operations preview</span>
          <h1>Operational Response Workspace</h1>
          <p>Service-point workspaces, data filters and aggregate response queues for EOC teams. No patient or contact line lists are shown.</p>
        </div>
        <button className="btn btn--secondary" type="button" onClick={() => setUser(null)}>Sign out</button>
      </section>

      <section className="ops-tab-shell">
        <nav className="ops-nav" aria-label="Operational workspace tabs">
          <div className="tabs ops-view-tabs" role="tablist" aria-label="Operational workspace tabs">
            {OPERATIONAL_TABS.map((tab) => (
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

        <OperationalTabFilters activeTab={activeTab} filters={filters} onChange={updateFilter} />

        <div
          id={`ops-panel-${activeTab.key}`}
          className="ops-tab-panel"
          role="tabpanel"
          aria-labelledby={`ops-tab-${activeTab.key}`}
        >
          {activeTab.key === "summary" ? (
            <SummaryTab data={data} />
          ) : (
            <ServiceDetailTab activeTab={activeTab} data={data} />
          )}
        </div>
      </section>
    </main>
  );
}
