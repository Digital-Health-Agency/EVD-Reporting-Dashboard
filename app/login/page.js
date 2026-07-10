"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AuthShell from "@/components/auth/AuthShell";
import PasswordField from "@/components/PasswordField";
import { useAuth } from "@/hooks/use-auth";
import { signIn } from "@/lib/auth-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isPending, refetch } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(
    searchParams.get("error") === "unauthorized"
      ? "Your account does not have access to that page."
      : ""
  );
  const [busy, setBusy] = useState(false);
  const next = searchParams.get("next") || "/operational";
  const destination = next.startsWith("/") ? next : "/operational";

  useEffect(() => {
    if (isPending || !isAuthenticated) return;
    router.replace(destination);
  }, [destination, isAuthenticated, isPending, router]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await signIn.email({
        email: form.email.trim(),
        password: form.password,
      });
      if (result?.error) {
        setError(result.error.message || "Invalid email or password.");
        return;
      }
      await refetch();
      router.replace(destination);
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell eyebrow="Restricted access" title="Sign in">
      <form className="auth-form" onSubmit={submit}>
        {error ? <p className="form-alert" role="alert">{error}</p> : null}
        <label className="form-field" htmlFor="email">
          <span>Email</span>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />
        <div className="auth-form__row">
          <Link href="/forgot-password">Forgot password?</Link>
        </div>
        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <>
      <AppHeader variant="operational" />
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
