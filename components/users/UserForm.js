"use client";

import { useEffect, useState } from "react";
import PasswordField from "@/components/PasswordField";
import { parseRoles } from "@/lib/auth-user";

export default function UserForm({
  initialUser,
  submitLabel = "Save user",
  includePassword = false,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "user",
    surveillance: false,
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initialUser) return;
    setForm((current) => ({
      ...current,
      name: initialUser.name || "",
      email: initialUser.email || "",
      role: parseRoles(initialUser.role).includes("admin") ? "admin" : "user",
      surveillance: parseRoles(initialUser.role).includes("surveillance"),
    }));
  }, [initialUser]);

  async function submit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Full name and email are required.");
      return;
    }
    setBusy(true);
    setError("");

    const roles = form.surveillance ? [form.role, "surveillance"] : [form.role];
    try {
      await onSubmit({
        name: form.name.trim(),
        email: form.email.trim(),
        role: roles.join(","),
        password: form.password.trim(),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save user.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="console-form" onSubmit={submit}>
      {error ? <p className="form-alert" role="alert">{error}</p> : null}
      <div className="form-grid">
        <label className="form-field" htmlFor="user-name">
          <span>Full name</span>
          <input
            id="user-name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </label>
        <label className="form-field" htmlFor="user-email">
          <span>Email</span>
          <input
            id="user-email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>
      </div>
      <div className="form-grid">
        <label className="form-field" htmlFor="user-role">
          <span>Role</span>
          <select
            id="user-role"
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        {includePassword ? (
          <PasswordField
            id="user-password"
            label="Password"
            minLength={8}
            placeholder="Optional"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
        ) : null}
      </div>
      <label className="form-check" htmlFor="user-surveillance">
        <input
          id="user-surveillance"
          type="checkbox"
          checked={form.surveillance}
          onChange={(event) => setForm((current) => ({ ...current, surveillance: event.target.checked }))}
        />
        <span className="form-check__copy">
          <span className="form-check__label">Can view identifiers</span>
          <span className="form-check__hint">
            Allows this account to see identifying details on linelists and exports.
          </span>
        </span>
      </label>
      <div className="form-actions">
        {onCancel ? <button className="btn btn--secondary" type="button" onClick={onCancel}>Cancel</button> : null}
        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
