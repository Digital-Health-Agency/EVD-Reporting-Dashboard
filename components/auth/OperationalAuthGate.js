"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function OperationalAuthGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isPending } = useAuth();

  useEffect(() => {
    if (isPending || isAuthenticated) return;
    const next = encodeURIComponent(pathname || "/operational");
    router.replace(`/login?next=${next}`);
  }, [isAuthenticated, isPending, pathname, router]);

  if (isPending) {
    return (
      <main className="locked-page">
        <section className="locked-card">
          <span className="locked-card__label">Checking session</span>
          <h1>Loading operational workspace</h1>
          <p>Confirming your DHA EVD account session.</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="locked-page">
        <section className="locked-card">
          <span className="locked-card__label">Restricted access</span>
          <h1>Sign in required</h1>
          <p>Redirecting to the official sign-in page.</p>
        </section>
      </main>
    );
  }

  return children;
}
