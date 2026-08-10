import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

const SINGULAR_ROLE_COMPARISON =
  /(?:["'](?:user|admin|surveillance)["']\s*(?:===|!==)|(?:===|!==)\s*["'](?:user|admin|surveillance)["'])/;

test("dashboard auth utilities use Better Auth with the EVD app id", async () => {
  const [authClient, apiClient, appId, nextConfig, apiProxyConfig] =
    await Promise.all([
      source("../lib/auth-client.js"),
      source("../lib/api-client.js"),
      source("../lib/app-id.js"),
      source("../next.config.mjs"),
      source("../lib/api-proxy-config.js"),
    ]);

  assert.match(authClient, /createAuthClient/);
  assert.match(authClient, /better-auth\/react/);
  assert.match(authClient, /requestPasswordReset/);
  assert.match(authClient, /resetPassword/);
  assert.match(authClient, /changePassword/);
  assert.match(apiClient, /credentials: "include"/);
  assert.match(apiClient, /APP_ID_HEADER/);
  assert.match(appId, /x-evd-app-id/);
  assert.match(appId, /dashboard/);
  assert.match(nextConfig, /fallback/);
  assert.match(nextConfig, /\/api\/auth\/:path\*/);
  assert.match(nextConfig, /resolveApiProxyUrl/);
  assert.match(apiProxyConfig, /SERVER_URL/);
  assert.match(apiProxyConfig, /NEXT_PUBLIC_SERVER_URL/);
});

test("lib/auth-user reads the role as a set instead of collapsing it to two values", async () => {
  const {
    AUTH_ROLES,
    AUTH_ROLE_LABELS,
    parseRoles,
    hasRole,
    normalizeRoleString,
    normalizeAuthUser,
    roleLabel,
  } = await import("../lib/auth-user.js");

  assert.deepEqual([...AUTH_ROLES], ["user", "admin", "surveillance"]);
  assert.equal(typeof parseRoles, "function");
  assert.equal(typeof hasRole, "function");
  assert.equal(typeof normalizeRoleString, "function");

  assert.deepEqual(parseRoles("admin,surveillance"), ["admin", "surveillance"]);
  assert.deepEqual(parseRoles("surveillance, admin"), ["admin", "surveillance"]);
  assert.deepEqual(parseRoles("ADMIN"), ["admin"]);
  assert.deepEqual(parseRoles("admin,admin"), ["admin"]);
  assert.deepEqual(parseRoles("root"), []);
  assert.deepEqual(parseRoles("surveillance-lead"), []);
  assert.deepEqual(parseRoles(undefined), []);
  assert.deepEqual(parseRoles(null), []);
  assert.deepEqual(parseRoles(""), []);

  assert.equal(normalizeRoleString("surveillance, admin"), "admin,surveillance");
  assert.equal(normalizeRoleString("root"), "user");

  assert.equal(normalizeAuthUser({ role: "admin,surveillance" }).role, "admin,surveillance");
  assert.equal(normalizeAuthUser({ role: "surveillance, admin" }).role, "admin,surveillance");
  assert.equal(normalizeAuthUser({ role: "surveillance, admin" }).role.includes(" "), false);
  assert.equal(normalizeAuthUser({ role: "root" }).role, "user");
  assert.equal(normalizeAuthUser({}).role, "user");

  assert.equal(hasRole("admin,surveillance", "admin"), true);
  assert.equal(hasRole("admin,surveillance", "surveillance"), true);
  assert.equal(hasRole("surveillance", "admin"), false);

  assert.equal(AUTH_ROLE_LABELS.user, "User");
  assert.equal(AUTH_ROLE_LABELS.admin, "Admin");
  assert.equal(AUTH_ROLE_LABELS.surveillance, "Surveillance");

  const compound = roleLabel("admin,surveillance");
  assert.match(compound, /Admin/);
  assert.match(compound, /Surveillance/);
  assert.equal(roleLabel("user"), "User");
  assert.equal(roleLabel(undefined), "User");
});

test("the client derives every role right from the parsed set, never from a whole-string comparison", async () => {
  const [authUser, useAuthHook] = await Promise.all([
    source("../lib/auth-user.js"),
    source("../hooks/use-auth.js"),
  ]);

  assert.match(useAuthHook, /isSurveillance/);
  assert.match(useAuthHook, /hasRole\(role, "admin"\)/);
  assert.match(useAuthHook, /hasRole\(role, "surveillance"\)/);
  assert.doesNotMatch(authUser, SINGULAR_ROLE_COMPARISON);
  assert.doesNotMatch(useAuthHook, SINGULAR_ROLE_COMPARISON);
});

test("the users table and the user form carry a compound role without losing a role name", async () => {
  const [usersManagement, userForm, styles] = await Promise.all([
    source("../components/users/UsersManagement.js"),
    source("../components/users/UserForm.js"),
    source("../app/globals.css"),
  ]);

  assert.match(usersManagement, /parseRoles/);
  assert.match(usersManagement, /AUTH_ROLE_LABELS/);
  assert.match(usersManagement, /account-pill-group/);
  assert.doesNotMatch(usersManagement, SINGULAR_ROLE_COMPARISON);

  assert.match(userForm, /type="checkbox"/);
  assert.match(userForm, /checked=\{form\.surveillance\}/);
  assert.match(userForm, /surveillance: event\.target\.checked/);
  assert.match(userForm, /roles\.join\(","\)/);
  assert.doesNotMatch(userForm, SINGULAR_ROLE_COMPARISON);

  const SPACED_ROLE_PAIR = /["'][^"']*\b(?:user|admin|surveillance)\b, +\b(?:user|admin|surveillance)\b/;
  assert.doesNotMatch(userForm, SPACED_ROLE_PAIR);
  assert.doesNotMatch(usersManagement, SPACED_ROLE_PAIR);

  assert.match(styles, /\.account-pill--surveillance \{/);
  assert.match(styles, /\.account-pill--admin \{[\s\S]{0,200}\.account-pill--surveillance \{/);
});

test("auth routes include login, forgot password, and reset password flows", async () => {
  const [login, forgot, reset] = await Promise.all([
    source("../app/login/page.js"),
    source("../app/forgot-password/page.js"),
    source("../app/reset-password/page.js"),
  ]);

  assert.match(login, /AppHeader/);
  assert.match(login, /signIn\.email/);
  assert.match(login, /refetch/);
  assert.match(login, /Forgot password/);
  assert.match(login, /next/);
  assert.match(forgot, /AppHeader/);
  assert.match(forgot, /requestPasswordReset/);
  assert.match(forgot, /Check your email/);
  assert.match(reset, /resetPassword/);
  assert.match(reset, /token/);
  assert.match(reset, /Passwords do not match/);
  assert.doesNotMatch(await source("../components/auth/AuthShell.js"), /Kenya Public Health Surveillance/);
  assert.match(await source("../components/PasswordField.js"), /Show password/);
  assert.match(await source("../components/PasswordField.js"), /Hide password/);
  assert.match(login, /PasswordField/);
});

test("auth shell uses the generated identity image and navy form treatment", async () => {
  const [shell, styles, image] = await Promise.all([
    source("../components/auth/AuthShell.js"),
    source("../app/globals.css"),
    readFile(new URL("../public/images/evd-login-card.webp", import.meta.url)),
  ]);

  assert.match(shell, /auth-panel__identity" aria-hidden="true"/);
  assert.match(shell, /auth-card__content/);
  assert.match(styles, /url\("\/images\/evd-login-card\.webp"\)/);
  assert.match(styles, /\.auth-card \{[\s\S]*background: var\(--color-navy\)/);
  assert.match(styles, /\.auth-card \.auth-panel__copy span \{[\s\S]*color: #a6ddf1/);
  assert.match(styles, /@media \(max-width: 540px\) \{[\s\S]*\.auth-panel__identity/);
  assert.equal(image.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(image.subarray(8, 12).toString("ascii"), "WEBP");
});

test("shared header exposes login when signed out and profile logout menu when signed in", async () => {
  const header = await source("../components/AppHeader.js");

  assert.match(header, /useAuth/);
  assert.match(header, /href="\/login"/);
  assert.match(header, />Login</);
  assert.match(header, /Profile/);
  assert.match(header, /Logout/);
  assert.match(header, /app-header__user-menu/);
});

test("operational workspace is session gated and carries an admin-only tab group", async () => {
  const [page, workspace] = await Promise.all([
    source("../app/operational/page.js"),
    source("../components/OperationalWorkspace.js"),
  ]);

  assert.match(page, /OperationalAuthGate/);
  assert.match(workspace, /useAuth/);
  assert.match(workspace, /key: "users"/);
  assert.match(workspace, /label: "Users"/);
  assert.match(workspace, /key: "audit"/);
  assert.match(workspace, /label: "Audit"/);
  assert.match(workspace, /isAdmin/);
  assert.match(workspace, /UsersManagement/);
  assert.match(workspace, /AuditEvents/);

  const set = /const ADMIN_ONLY_TAB_KEYS = new Set\(\[([^\]]*)\]\)/.exec(workspace);
  assert.ok(set, "the admin-only tab keys must be declared once, as a set");
  assert.match(set[1], /"users"/);
  assert.match(set[1], /"audit"/);
  assert.match(workspace, /ADMIN_ONLY_TAB_KEYS\.has\(tab\.key\) \|\| isAdmin/);

  assert.doesNotMatch(workspace, /Temporary preview gate/);
  assert.doesNotMatch(workspace, /Any email and password/);
});

test("profile and user-management pages are present", async () => {
  const [
    profile,
    editProfile,
    changePassword,
    users,
    newUser,
    userDetail,
    usersManagement,
  ] = await Promise.all([
    source("../app/profile/page.js"),
    source("../app/profile/edit/page.js"),
    source("../app/profile/change-password/page.js"),
    source("../app/users/page.js"),
    source("../app/users/new/page.js"),
    source("../app/users/[id]/page.js"),
    source("../components/users/UsersManagement.js"),
  ]);

  assert.match(profile, /api\.get\("\/users\/me"\)/);
  assert.match(editProfile, /api\.upload\("\/upload"/);
  assert.match(editProfile, /api\.patch\("\/users\/me"/);
  assert.match(changePassword, /changePassword/);
  assert.match(users, /UsersManagement/);
  assert.match(newUser, /UserForm/);
  assert.match(userDetail, /api\.post\(`\/users\/\$\{userId\}\/password`/);
  assert.match(usersManagement, /api\.get\("\/users"/);
  assert.match(usersManagement, /api\.post\(`\/users\/\$\{target\.id\}\/deactivate`/);
});
