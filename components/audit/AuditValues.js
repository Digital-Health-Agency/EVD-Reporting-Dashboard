import { humanizeToken } from "@/lib/format";
import { fieldLabel } from "@/lib/headline-figures";

export function auditValue(value) {
  if (value == null) return "Not reported";
  if (typeof value === "boolean") return value ? "On" : "Off";
  if (typeof value === "number") return value.toLocaleString("en-KE");
  if (Array.isArray(value)) return value.map(auditValue).join(", ");
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

export default function AuditValues({ event }) {
  const { before, after } = event.filters || {};
  if (!before && !after) return <span>Change values were not recorded for this event.</span>;
  return (
    <div className="table-wrap">
      <table className="data-table audit-values">
        <caption className="sr-only">Values changed in this event</caption>
        <thead><tr><th scope="col">Field</th><th scope="col">Before</th><th scope="col">After</th></tr></thead>
        <tbody>{(event.columns || []).map((key) => (
          <tr key={key}>
            <th scope="row">{key === "operational_override" ? "Operational dashboard override" : fieldLabel(key) || humanizeToken(key)}</th>
            <td>{before === null ? "Record absent" : auditValue(before?.[key])}</td>
            <td>{after === null ? "Record removed" : auditValue(after?.[key])}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
