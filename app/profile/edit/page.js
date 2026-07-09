"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import ProfileGate from "@/components/auth/ProfileGate";
import { api } from "@/lib/api-client";
import { initialsFor, normalizeAuthUser, resolveResourceUrl } from "@/lib/auth-user";

export default function EditProfilePage() {
  const router = useRouter();
  const fileInput = useRef(null);
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    api.get("/users/me")
      .then((data) => {
        if (!mounted) return;
        const normalized = normalizeAuthUser(data);
        setUser(normalized);
        setName(normalized.name);
        setImage(normalized.image || null);
      })
      .catch(() => {
        if (mounted) setError("Unable to load profile.");
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function uploadPhoto(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await api.upload("/upload", formData);
      const path = result.path || result.url;
      if (!path) throw new Error("Upload response did not include a path.");
      setImage(path);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to upload photo.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.patch("/users/me", {
        name: name.trim(),
        image,
      });
      router.push("/profile");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to update profile.");
    } finally {
      setBusy(false);
    }
  }

  const photoUrl = resolveResourceUrl(image);

  return (
    <>
      <AppHeader variant="operational" />
      <ProfileGate>
        <main className="console-page">
          <section className="console-hero">
            <div>
              <span>Account</span>
              <h1>Edit profile</h1>
              <p>Update your display name and profile photo.</p>
            </div>
            <Link className="btn btn--secondary" href="/profile">Back to profile</Link>
          </section>

          <section className="console-card">
            <form className="console-form" onSubmit={submit}>
              {error ? <p className="form-alert" role="alert">{error}</p> : null}
              <div className="profile-photo-field">
                <div className="profile-avatar">
                  {photoUrl ? <Image src={photoUrl} alt="" width={96} height={96} /> : <span>{initialsFor(user)}</span>}
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => uploadPhoto(event.target.files?.[0])}
                />
                <div className="profile-photo-field__actions">
                  <button className="btn btn--secondary" type="button" disabled={uploading || busy} onClick={() => fileInput.current?.click()}>
                    {uploading ? "Uploading..." : "Change photo"}
                  </button>
                  {image ? <button className="btn btn--secondary" type="button" disabled={uploading || busy} onClick={() => setImage(null)}>Remove</button> : null}
                </div>
              </div>

              <div className="form-grid">
                <label className="form-field" htmlFor="profile-name">
                  <span>Full name</span>
                  <input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} />
                </label>
                <label className="form-field" htmlFor="profile-email">
                  <span>Email</span>
                  <input id="profile-email" value={user?.email || ""} readOnly />
                </label>
              </div>
              <div className="form-actions">
                <Link className="btn btn--secondary" href="/profile">Cancel</Link>
                <button className="btn btn--primary" type="submit" disabled={busy || uploading}>
                  {busy ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </main>
      </ProfileGate>
    </>
  );
}
