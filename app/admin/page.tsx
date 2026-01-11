import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

export default async function AdminPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/admin/login");
  }

  redirect("/admin/posts");
}
