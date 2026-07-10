"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function ExecutiveAuthGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isPending, isRefetching } = useAuth();

  useEffect(() => {
    if (isPending || isRefetching || isAuthenticated) return;
    const next = encodeURIComponent(pathname || "/executive");
    router.replace(`/login?next=${next}`);
  }, [isAuthenticated, isPending, isRefetching, pathname, router]);

  if (isPending || isRefetching) {
    return (
      <main className="locked-page">
        <section className="locked-card">
          <span className="locked-card__label">Checking session</span>
          <h1>Loading executive dashboard</h1>
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
