import { redirect } from "next/navigation";

export default function LoginPage() {
  // Stack Auth의 로그인 페이지로 리다이렉트
  redirect("/handler/sign-in?after=/admin/write");
}
