"use client";

import AppHeader from "@/components/AppHeader";
import AdminGate from "@/components/auth/AdminGate";
import UsersManagement from "@/components/users/UsersManagement";

export default function UsersPage() {
  return (
    <>
      <AppHeader variant="operational" />
      <AdminGate>
        <main className="console-page">
          <UsersManagement />
        </main>
      </AdminGate>
    </>
  );
}
