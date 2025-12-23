import { stackServerApp } from "@/stack/server";

export async function getAuthUser() {
  if (!stackServerApp) {
    return null;
  }
  try {
    return await stackServerApp.getUser();
  } catch {
    return null;
  }
}
