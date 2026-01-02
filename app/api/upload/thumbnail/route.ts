import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    if (!request.body) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const thumbnailFilename = `thumbnail-${Date.now()}-${filename}`;

    const blob = await put(thumbnailFilename, request.body, {
      access: "public",
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Thumbnail upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
