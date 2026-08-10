"use client";

import AppHeader from "@/components/AppHeader";
import AdminGate from "@/components/auth/AdminGate";
import AuditEvents from "@/components/audit/AuditEvents";

export default function AuditPage() {
  return (
    <>
      <AppHeader variant="operational" />
      <AdminGate>
        <main className="console-page">
          <AuditEvents />
        </main>
      </AdminGate>
    </>
  );
}
