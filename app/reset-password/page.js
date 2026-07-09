"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import PasswordField from "@/components/PasswordField";
import { resetPassword } from "@/lib/auth-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (searchParams.get("error") === "INVALID_TOKEN") {
      setError("This reset link is invalid or has expired. Request a new one.");
    }
  }, [searchParams]);

  async function submit(event) {
    event.preventDefault();
    if (!token) {
      setError("Missing reset token. Request a new reset link.");
      return;
    }
    if (form.password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await resetPassword({ token, newPassword: form.password });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1200);
    } catch {
      setError("Unable to reset password. Request a new link and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell eyebrow="Account recovery" title="Reset password">
      <form className="auth-form" onSubmit={submit}>
        {error ? <p className="form-alert" role="alert">{error}</p> : null}
        {success ? <p className="form-success" role="status">Password reset successful. Redirecting to sign in...</p> : null}
        <PasswordField
          id="password"
          label="New password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />
        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
        />
        <button className="btn btn--primary" type="submit" disabled={busy || success}>
          {busy ? "Updating..." : "Update password"}
        </button>
        <Link className="auth-link" href="/login">Back to sign in</Link>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
