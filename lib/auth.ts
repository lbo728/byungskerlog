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

// 관리자 ID 목록 (환경변수로 관리)
const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(",").map((id) => id.trim()) || [];

export function isAdminUser(userId: string): boolean {
  return ADMIN_USER_IDS.includes(userId);
}

export async function getAuthUserWithAdminCheck() {
  const user = await getAuthUser();
  if (!user) {
    return { user: null, isAdmin: false };
  }
  return {
    user,
    isAdmin: isAdminUser(user.id),
  };
}
