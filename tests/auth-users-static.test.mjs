import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

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

test("auth routes include login, forgot password, and reset password flows", async () => {
  const [login, forgot, reset] = await Promise.all([
    source("../app/login/page.js"),
    source("../app/forgot-password/page.js"),
    source("../app/reset-password/page.js"),
  ]);

  assert.match(login, /AppHeader/);
  assert.match(login, /signIn\.email/);
  assert.match(login, /Forgot password/);
  assert.match(login, /next/);
  assert.match(forgot, /AppHeader/);
  assert.match(forgot, /requestPasswordReset/);
  assert.match(forgot, /Check your email/);
  assert.match(reset, /resetPassword/);
  assert.match(reset, /token/);
  assert.match(reset, /Passwords do not match/);
  assert.doesNotMatch(await source("../components/auth/AuthShell.js"), /Kenya EVD Dashboard/);
  assert.match(await source("../components/PasswordField.js"), /Show password/);
  assert.match(await source("../components/PasswordField.js"), /Hide password/);
  assert.match(login, /PasswordField/);
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

test("operational workspace is session gated and has admin-only Users as the final tab", async () => {
  const [page, workspace] = await Promise.all([
    source("../app/operational/page.js"),
    source("../components/OperationalWorkspace.js"),
  ]);

  assert.match(page, /OperationalAuthGate/);
  assert.match(workspace, /useAuth/);
  assert.match(workspace, /key: "users"/);
  assert.match(workspace, /label: "Users"/);
  assert.match(workspace, /isAdmin/);
  assert.match(workspace, /UsersManagement/);
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
