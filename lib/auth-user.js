export function normalizeAuthUser(raw = {}) {
  const id = raw.id || raw._id || "";
  const email = raw.email || "";
  const name = raw.name || raw.fullName || email || "User";
  return {
    id: String(id),
    name: String(name),
    fullName: raw.fullName || raw.name || "",
    email: String(email),
    emailVerified: Boolean(raw.emailVerified),
    image: raw.image || null,
    role: raw.role === "admin" ? "admin" : "user",
    status: raw.status || (raw.banned ? "inactive" : "active"),
    banned: Boolean(raw.banned),
    banReason: raw.banReason || null,
    createdAt: raw.createdAt || "",
    updatedAt: raw.updatedAt || raw.createdAt || "",
  };
}

export function displayName(user) {
  if (!user) return "User";
  return user.name?.trim() || user.email?.split("@")[0] || "User";
}

export function initialsFor(user) {
  const value = displayName(user);
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (value) return value.slice(0, 2).toUpperCase();
  return "EV";
}

export function roleLabel(role) {
  return role === "admin" ? "Admin" : "User";
}

export function statusLabel(status) {
  return status === "inactive" ? "Inactive" : "Active";
}

export function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function resolveResourceUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}
