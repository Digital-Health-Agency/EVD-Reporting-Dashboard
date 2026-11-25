"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function ReconciliationGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isReconciliation, isPending, isRefetching } = useAuth();

  useEffect(() => {
    if (isPending || isRefetching || isAuthenticated) return;
    const next = encodeURIComponent(pathname || "/reconciliation");
    router.replace(`/login?next=${next}`);
  }, [isAuthenticated, isPending, isRefetching, pathname, router]);

  if (isPending || (isRefetching && !isAuthenticated)) {
    return (
      <main className="locked-page">
        <section className="locked-card">
          <span className="locked-card__label">Checking access</span>
          <h1>Loading account permissions</h1>
          <p>Confirming your role before opening reconciliation.</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  if (!isReconciliation) {
    return (
      <main className="locked-page">
        <section className="locked-card">
          <span className="locked-card__label">Restricted</span>
          <h1>Reconciliation is restricted</h1>
          <p>Your account can use the operational workspace, but entering official figures requires the reconciliation grant.</p>
          <Link className="btn btn--primary" href="/operational">Back to workspace</Link>
        </section>
      </main>
    );
  }

  return children;
}
