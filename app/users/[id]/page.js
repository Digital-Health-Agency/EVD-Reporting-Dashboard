"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AdminGate from "@/components/auth/AdminGate";
import PasswordField from "@/components/PasswordField";
import UserForm from "@/components/users/UserForm";
import { api } from "@/lib/api-client";
import { formatDate, normalizeAuthUser, roleLabel, statusLabel } from "@/lib/auth-user";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id;
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refreshUser() {
    const data = await api.get(`/users/${userId}`);
    setUser(normalizeAuthUser(data));
  }

  useEffect(() => {
    let mounted = true;
    api.get(`/users/${userId}`)
      .then((data) => {
        if (mounted) setUser(normalizeAuthUser(data));
      })
      .catch((caught) => {
        if (mounted) setError(caught instanceof Error ? caught.message : "Failed to load user.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  async function saveUser(data) {
    const updated = await api.patch(`/users/${userId}`, {
      name: data.name,
      email: data.email,
      role: data.role,
    });
    setUser(normalizeAuthUser(updated));
    setMessage("User updated.");
  }

  async function setUserPassword(event) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setMessage("");
    try {
      await api.post(`/users/${userId}/password`, {
        password,
      });
      setPassword("");
      setMessage("Password updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to update password.");
    }
  }

  async function toggleStatus() {
    if (!user) return;
    setError("");
    setMessage("");
    try {
      if (user.status === "active") {
        await api.post(`/users/${user.id}/deactivate`, {
          reason: "Deactivated by admin",
        });
      } else {
        await api.post(`/users/${user.id}/activate`);
      }
      await refreshUser();
      setMessage(`User ${user.status === "active" ? "deactivated" : "activated"}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to update user status.");
    }
  }

  async function deleteUser() {
    if (!window.confirm(`Delete ${user?.name || "this user"}?`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      router.push("/users");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to delete user.");
    }
  }

  return (
    <>
      <AppHeader variant="operational" />
      <AdminGate>
        <main className="console-page">
          <section className="console-hero">
            <div>
              <span>Admin</span>
              <h1>{user?.name || "User account"}</h1>
              <p>Update login account details, access state and password.</p>
            </div>
            <Link className="btn btn--secondary" href="/users">Back to users</Link>
          </section>

          {message ? <p className="form-success" role="status">{message}</p> : null}
          {error ? <p className="form-alert" role="alert">{error}</p> : null}

          {loading ? (
            <section className="console-card">Loading user...</section>
          ) : user ? (
            <div className="user-detail-grid">
              <section className="console-card">
                <div className="console-section-head console-section-head--compact">
                  <div>
                    <span>Profile</span>
                    <h2>User profile</h2>
                  </div>
                </div>
                <UserForm initialUser={user} submitLabel="Save user" onSubmit={saveUser} />
              </section>

              <aside className="console-card user-side-card">
                <h2>Account status</h2>
                <dl className="detail-list">
                  <div>
                    <dt>Status</dt>
                    <dd>{statusLabel(user.status)}</dd>
                  </div>
                  <div>
                    <dt>Role</dt>
                    <dd>{roleLabel(user.role)}</dd>
                  </div>
                  <div>
                    <dt>Email verified</dt>
                    <dd>{user.emailVerified ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{formatDate(user.createdAt)}</dd>
                  </div>
                </dl>
                <button className="btn btn--secondary" type="button" onClick={toggleStatus}>
                  {user.status === "active" ? "Deactivate user" : "Activate user"}
                </button>
                <form className="console-form console-form--compact" onSubmit={setUserPassword}>
                  <PasswordField
                    id="admin-user-password"
                    label="New password"
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button className="btn btn--primary" type="submit">Set password</button>
                </form>
                <button className="btn btn--danger" type="button" onClick={deleteUser}>Delete user</button>
              </aside>
            </div>
          ) : (
            <section className="console-card">User not found.</section>
          )}
        </main>
      </AdminGate>
    </>
  );
}
