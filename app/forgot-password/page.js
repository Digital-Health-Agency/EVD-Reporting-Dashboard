"use client";

import Link from "next/link";
import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import AuthShell from "@/components/auth/AuthShell";
import { requestPasswordReset } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await requestPasswordReset({
        email: email.trim(),
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setSent(true);
    } catch {
      setError("Could not send reset instructions. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AppHeader variant="operational" />
      <AuthShell eyebrow="Account recovery" title={sent ? "Check your email" : "Forgot password"}>
        {sent ? (
          <div className="auth-form" role="status" aria-live="polite">
            <p className="form-success">If the account exists, a password reset link has been generated.</p>
            <Link className="btn btn--secondary" href="/login">Back to sign in</Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            {error ? <p className="form-alert" role="alert">{error}</p> : null}
            <label className="form-field" htmlFor="email">
              <span>Email</span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? "Sending..." : "Send reset link"}
            </button>
            <Link className="auth-link" href="/login">Back to sign in</Link>
          </form>
        )}
      </AuthShell>
    </>
  );
}
