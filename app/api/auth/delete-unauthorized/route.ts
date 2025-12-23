import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";

const ALLOWED_EMAILS = ["extreme0728@gmail.com"];

export async function POST() {
  try {
    const user = await stackServerApp.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!user.primaryEmail || ALLOWED_EMAILS.includes(user.primaryEmail)) {
      return NextResponse.json(
        { error: "User is authorized" },
        { status: 400 }
      );
    }

    await user.delete();

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
