"use client";

import { createAuthClient } from "better-auth/react";
import { APP_ID_HEADER, EVD_APP_ID } from "./app-id";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  fetchOptions: {
    headers: {
      [APP_ID_HEADER]: EVD_APP_ID,
    },
  },
});

export const {
  signIn,
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
  changePassword,
} = authClient;
