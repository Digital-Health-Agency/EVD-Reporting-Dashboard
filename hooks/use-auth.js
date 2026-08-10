"use client";

import { signIn, signOut, useSession } from "@/lib/auth-client";
import { hasRole, normalizeAuthUser } from "@/lib/auth-user";

export function useAuth() {
  const session = useSession();
  const user = session.data?.user ? normalizeAuthUser(session.data.user) : null;
  const role = user?.role;

  return {
    user,
    session: session.data,
    isAuthenticated: Boolean(user),
    isPending: Boolean(session.isPending),
    isRefetching: Boolean(session.isRefetching),
    error: session.error,
    role,
    isAdmin: hasRole(role, "admin"),
    isSurveillance: hasRole(role, "surveillance"),
    login: (email, password) => signIn.email({ email, password }),
    logout: () => signOut(),
    refetch: session.refetch,
  };
}
