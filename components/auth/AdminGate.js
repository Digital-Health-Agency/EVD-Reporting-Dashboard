"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function AdminGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, isPending } = useAuth();

  useEffect(() => {
    if (isPending || isAuthenticated) return;
    const next = encodeURIComponent(pathname || "/users");
    router.replace(`/login?next=${next}`);
  }, [isAuthenticated, isPending, pathname, router]);

  if (isPending) {
    return (
      <main className="locked-page">
        <section className="locked-card">
          <span className="locked-card__label">Checking access</span>
          <h1>Loading account permissions</h1>
          <p>Confirming your role before opening user management.</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  if (!isAdmin) {
    return (
      <main className="locked-page">
        <section className="locked-card">
          <span className="locked-card__label">Admin only</span>
          <h1>User management is restricted</h1>
          <p>Your account can use the operational workspace, but user administration requires an admin role.</p>
          <Link className="btn btn--primary" href="/operational">Back to workspace</Link>
        </section>
      </main>
    );
  }

  return children;
}
