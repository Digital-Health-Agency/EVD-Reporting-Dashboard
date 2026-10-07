"use client";

import AppHeader from "@/components/AppHeader";
import ReconciliationGate from "@/components/auth/ReconciliationGate";
import ReconciliationList from "@/components/reconciliation/ReconciliationList";

export default function ReconciliationPage() {
  return (
    <>
      <AppHeader variant="operational" />
      <ReconciliationGate>
        <main className="console-page">
          <ReconciliationList />
        </main>
      </ReconciliationGate>
    </>
  );
}
