import { NextRequest, NextResponse } from "next/server";

export default async function proxy(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute) {
    // Stack Auth 쿠키 확인
    const stackSessionCookie = request.cookies.get("stack-session");

    if (!stackSessionCookie) {
      // 로그인되지 않은 사용자는 로그인 페이지로 리다이렉트
      return NextResponse.redirect(
        new URL("/handler/sign-in?after=" + request.nextUrl.pathname, request.url)
      );
    }
  }

  return NextResponse.next();
}
