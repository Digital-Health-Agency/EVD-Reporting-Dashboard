"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import ReconciliationGate from "@/components/auth/ReconciliationGate";
import RecordAuditTrail from "@/components/reconciliation/RecordAuditTrail";
import ReconciliationForm from "@/components/reconciliation/ReconciliationForm";
import { api } from "@/lib/api-client";
import { changedFields, formatSituationDate } from "@/lib/headline-figures";

export default function EditReconciliationPage() {
  const { situationDate } = useParams();
  const router = useRouter();
  const rowPath = `/reconciliation/headline/${encodeURIComponent(situationDate)}`;
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warehouse, setWarehouse] = useState();
  const [warehouseError, setWarehouseError] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([api.get(rowPath), api.get("/reconciliation/warehouse")]).then(
      ([rowResult, warehouseResult]) => {
        if (!mounted) return;
        if (rowResult.status === "fulfilled") {
          setRow(rowResult.value);
        } else {
          const { reason } = rowResult;
          setError(reason instanceof Error ? reason.message : "Check your connection and try again.");
        }
        if (warehouseResult.status === "fulfilled") setWarehouse(warehouseResult.value);
        else setWarehouseError(true);
        setLoading(false);
      },
    );
    return () => {
      mounted = false;
    };
  }, [rowPath]);

  const saveRow = async ({ situation_date: _key, ...next }) => {
    const changes = changedFields(row, next);
    if (Object.keys(changes).length > 0) await api.patch(rowPath, { ...changes, expected_revision: row.revision, expected_record_id: row.record_id });
    router.push("/reconciliation");
  };

  return (
    <>
      <AppHeader variant="operational" />
      <ReconciliationGate>
        <main className="console-page">
          <section className="console-hero">
            <div>

              <h1>Figures for {formatSituationDate(situationDate)}</h1>
              <p>Enter the official figures for one date. Blank cumulative fields keep the most recent official total. Blank 24-hour fields and screening points use warehouse figures.</p>
            </div>
            <Link className="btn btn--secondary" href="/reconciliation">Back to figures</Link>
          </section>
          <section className="console-card">
            {loading ? (
              "Loading official figures..."
            ) : row ? (
              <ReconciliationForm
                initialRow={row}
                warehouse={warehouse}
                warehouseError={warehouseError}
                onSubmit={saveRow}
                onReload={() => window.location.reload()}
                onCancel={() => router.push("/reconciliation")}
              />
            ) : (
              <p className="form-alert" role="alert">Could not load official figures. {error}</p>
            )}
          </section>
          {!loading ? <RecordAuditTrail situationDate={situationDate} /> : null}
        </main>
      </ReconciliationGate>
    </>
  );
}
