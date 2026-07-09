"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function ProfileGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isPending } = useAuth();

  useEffect(() => {
    if (isPending || isAuthenticated) return;
    const next = encodeURIComponent(pathname || "/profile");
    router.replace(`/login?next=${next}`);
  }, [isAuthenticated, isPending, pathname, router]);

  if (isPending) {
    return (
      <main className="locked-page">
        <section className="locked-card">
          <span className="locked-card__label">Checking session</span>
          <h1>Loading profile</h1>
          <p>Confirming your account session.</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) return null;
  return children;
}
