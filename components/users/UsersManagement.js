"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { formatDate, normalizeAuthUser, roleLabel, statusLabel } from "@/lib/auth-user";

function StatusPill({ status }) {
  return <span className={`account-pill account-pill--${status === "inactive" ? "inactive" : "active"}`}>{statusLabel(status)}</span>;
}

function RolePill({ role }) {
  return <span className={`account-pill account-pill--${role === "admin" ? "admin" : "user"}`}>{roleLabel(role)}</span>;
}

export default function UsersManagement({ embedded = false }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: String(page),
        limit: String(limit),
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;
      const response = await api.get("/users", params);
      setUsers((response.data || []).map(normalizeAuthUser));
      setTotal(Number(response.total || 0));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);
  const hasFilters = useMemo(() => Boolean(search.trim()) || statusFilter !== "all", [search, statusFilter]);

  async function toggleStatus(target) {
    setMessage("");
    setError("");
    try {
      if (target.status === "active") {
        await api.post(`/users/${target.id}/deactivate`, {
          reason: "Deactivated by admin",
        });
      } else {
        await api.post(`/users/${target.id}/activate`);
      }
      setMessage(`User ${target.status === "active" ? "deactivated" : "activated"}.`);
      await fetchUsers();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to update user.");
    }
  }

  return (
    <section className={embedded ? "users-section users-section--embedded" : "users-section"}>
      <div className="console-section-head">
        <div>
          <span>Admin</span>
          <h2>User management</h2>
          <p>Login accounts, roles, account status and password actions.</p>
        </div>
        <Link className="btn btn--primary" href="/users/new">Add user</Link>
      </div>

      <div className="console-card users-card">
        <div className="users-toolbar">
          <label className="users-search" htmlFor={embedded ? "embedded-user-search" : "user-search"}>
            <span>Search</span>
            <input
              id={embedded ? "embedded-user-search" : "user-search"}
              value={search}
              placeholder="Name, email, or role"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="users-filter" htmlFor={embedded ? "embedded-user-status" : "user-status"}>
            <span>Status</span>
            <select
              id={embedded ? "embedded-user-status" : "user-status"}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          {hasFilters ? (
            <button className="btn btn--secondary" type="button" onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}>
              Clear
            </button>
          ) : null}
        </div>

        {message ? <p className="form-success" role="status">{message}</p> : null}
        {error ? <p className="form-alert" role="alert">{error}</p> : null}

        <div className="table-wrap">
          <table className="data-table users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th className="num">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5}>No users found.</td>
                </tr>
              ) : users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                  </td>
                  <td><RolePill role={user.role} /></td>
                  <td><StatusPill status={user.status} /></td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td className="num">
                    <div className="table-actions">
                      <Link className="btn btn--table" href={`/users/${user.id}`}>View</Link>
                      <button className="btn btn--table" type="button" onClick={() => toggleStatus(user)}>
                        {user.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && total > 0 ? (
          <div className="users-pagination">
            <span>Showing {rangeStart}-{rangeEnd} of {total.toLocaleString()}</span>
            <div>
              <button className="btn btn--secondary" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button className="btn btn--secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
