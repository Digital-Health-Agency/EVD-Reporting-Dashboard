"use client";

import Link from "next/link";
import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import ProfileGate from "@/components/auth/ProfileGate";
import { changePassword } from "@/lib/auth-client";

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (!form.currentPassword) {
      setError("Enter your current password.");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        revokeOtherSessions: false,
      });
      if (result?.error) {
        setError(result.error.message || "Unable to update password.");
        return;
      }
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage("Password updated.");
    } catch {
      setError("Unable to update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AppHeader variant="operational" />
      <ProfileGate>
        <main className="console-page">
          <section className="console-hero">
            <div>
              <span>Security</span>
              <h1>Change password</h1>
              <p>Keep your DHA EVD account secure.</p>
            </div>
            <Link className="btn btn--secondary" href="/profile">Back to profile</Link>
          </section>
          <section className="console-card">
            <form className="console-form" onSubmit={submit}>
              {error ? <p className="form-alert" role="alert">{error}</p> : null}
              {message ? <p className="form-success" role="status">{message}</p> : null}
              <label className="form-field" htmlFor="current-password">
                <span>Current password</span>
                <input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={form.currentPassword}
                  onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))}
                />
              </label>
              <div className="form-grid">
                <label className="form-field" htmlFor="new-password">
                  <span>New password</span>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={form.newPassword}
                    onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
                  />
                </label>
                <label className="form-field" htmlFor="confirm-new-password">
                  <span>Confirm new password</span>
                  <input
                    id="confirm-new-password"
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  />
                </label>
              </div>
              <div className="form-actions">
                <Link className="btn btn--secondary" href="/profile">Cancel</Link>
                <button className="btn btn--primary" type="submit" disabled={busy}>
                  {busy ? "Updating..." : "Update password"}
                </button>
              </div>
            </form>
          </section>
        </main>
      </ProfileGate>
    </>
  );
}
