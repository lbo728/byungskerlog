import { stackServerApp } from "@/stack/server";
import { NextRequest, NextResponse } from "next/server";

export default async function proxy(request: NextRequest) {
  // Stack Auth를 사용한 인증 확인
  const user = await stackServerApp.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute && !user) {
    // 로그인되지 않은 사용자는 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL("/handler/sign-in?after=" + request.nextUrl.pathname, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
