import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";

const ALLOWED_EMAILS = ["extreme0728@gmail.com"];

export async function middleware(request: NextRequest) {
  const user = await stackServerApp.getUser();

  // 로그인된 사용자가 있고, 화이트리스트에 없는 경우
  if (user && user.primaryEmail && !ALLOWED_EMAILS.includes(user.primaryEmail)) {
    // 로그아웃 처리
    const signOutUrl = new URL("/handler/sign-out", request.url);
    const response = NextResponse.redirect(signOutUrl);

    // 에러 메시지를 쿼리 파라미터로 전달
    signOutUrl.searchParams.set("error", "unauthorized");

    return NextResponse.redirect(signOutUrl);
  }

  // admin 페이지 접근 시 로그인 체크
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      const signInUrl = new URL("/handler/sign-in", request.url);
      signInUrl.searchParams.set("after", request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    // admin 페이지는 화이트리스트 이메일만 접근 가능
    if (user.primaryEmail && !ALLOWED_EMAILS.includes(user.primaryEmail)) {
      return new NextResponse("Unauthorized", { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
};
