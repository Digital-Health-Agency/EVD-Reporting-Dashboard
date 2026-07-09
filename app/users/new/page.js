"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AdminGate from "@/components/auth/AdminGate";
import UserForm from "@/components/users/UserForm";
import { api } from "@/lib/api-client";

export default function NewUserPage() {
  const router = useRouter();

  async function createUser(data) {
    const payload = {
      name: data.name,
      email: data.email,
      role: data.role,
    };
    if (data.password) payload.password = data.password;
    const created = await api.post("/users", payload);
    router.push(`/users/${created.id}`);
  }

  return (
    <>
      <AppHeader variant="operational" />
      <AdminGate>
        <main className="console-page">
          <section className="console-hero">
            <div>
              <span>Admin</span>
              <h1>Add user</h1>
              <p>Create a DHA EVD login account with a role and optional password.</p>
            </div>
            <Link className="btn btn--secondary" href="/users">Back to users</Link>
          </section>
          <section className="console-card">
            <UserForm includePassword submitLabel="Create user" onSubmit={createUser} onCancel={() => router.push("/users")} />
          </section>
        </main>
      </AdminGate>
    </>
  );
}
