"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import ProfileGate from "@/components/auth/ProfileGate";
import { api } from "@/lib/api-client";
import { formatDate, initialsFor, normalizeAuthUser, resolveResourceUrl, roleLabel, statusLabel } from "@/lib/auth-user";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get("/users/me")
      .then((data) => {
        if (mounted) setUser(normalizeAuthUser(data));
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <AppHeader variant="operational" />
      <ProfileGate>
        <main className="console-page">
          <section className="console-hero">
            <div>
              <span>Account</span>
              <h1>My Profile</h1>
              <p>Review and manage your DHA EVD login account.</p>
            </div>
            <Link className="btn btn--secondary" href="/operational">Operational workspace</Link>
          </section>

          {loading ? (
            <section className="console-card">Loading profile...</section>
          ) : (
            <section className="profile-grid">
              <article className="console-card profile-summary">
                <div className="profile-avatar">
                  {resolveResourceUrl(user?.image) ? (
                    <Image src={resolveResourceUrl(user.image)} alt="" width={96} height={96} />
                  ) : (
                    <span>{initialsFor(user)}</span>
                  )}
                </div>
                <h2>{user?.name || "User"}</h2>
                <p>{user?.email || "-"}</p>
                <div className="profile-actions">
                  <Link className="btn btn--primary" href="/profile/edit">Edit profile</Link>
                  <Link className="btn btn--secondary" href="/profile/change-password">Change password</Link>
                </div>
              </article>

              <article className="console-card">
                <div className="console-section-head console-section-head--compact">
                  <div>
                    <span>Login account</span>
                    <h2>Account details</h2>
                  </div>
                </div>
                <dl className="detail-list">
                  <div>
                    <dt>Full name</dt>
                    <dd>{user?.name || "-"}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{user?.email || "-"}</dd>
                  </div>
                  <div>
                    <dt>Role</dt>
                    <dd>{roleLabel(user?.role)}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{statusLabel(user?.status)}</dd>
                  </div>
                  <div>
                    <dt>Email verified</dt>
                    <dd>{user?.emailVerified ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{formatDate(user?.createdAt)}</dd>
                  </div>
                </dl>
              </article>
            </section>
          )}
        </main>
      </ProfileGate>
    </>
  );
}
