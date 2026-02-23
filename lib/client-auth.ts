"use client";

import { useUser } from "@stackframe/stack";

export const ADMIN_EMAILS = ["extreme0728@gmail.com", "admin@byungskerlog.com"];

export function useIsAdmin(): boolean {
  const user = useUser();
  return Boolean(user?.primaryEmail && ADMIN_EMAILS.includes(user.primaryEmail));
}
