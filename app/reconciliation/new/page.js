"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import ReconciliationGate from "@/components/auth/ReconciliationGate";
import ReconciliationForm from "@/components/reconciliation/ReconciliationForm";
import { api } from "@/lib/api-client";

export default function NewReconciliationPage() {
  const router = useRouter();
  const [warehouse, setWarehouse] = useState();
  const [warehouseError, setWarehouseError] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.get("/reconciliation/warehouse")
      .then((data) => {
        if (mounted) setWarehouse(data);
      })
      .catch(() => {
        if (mounted) setWarehouseError(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const createRow = async (body) => {
    await api.post("/reconciliation/headline", body);
    router.push("/reconciliation");
  };

  return (
    <>
      <AppHeader variant="operational" />
      <ReconciliationGate>
        <main className="console-page">
          <section className="console-hero">
            <div>
              <h1>Add situation date</h1>
              <p>Enter the official figures for one date. Blank cumulative fields keep the most recent official total. Blank 24-hour fields and screening points use warehouse figures.</p>
            </div>
            <Link className="btn btn--secondary" href="/reconciliation">Back to figures</Link>
          </section>
          <section className="console-card">
            <ReconciliationForm
              warehouse={warehouse}
              warehouseError={warehouseError}
              onSubmit={createRow}
              onCancel={() => router.push("/reconciliation")}
            />
          </section>
        </main>
      </ReconciliationGate>
    </>
  );
}
