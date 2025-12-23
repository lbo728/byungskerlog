import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

const MAX_SIZE = 500 * 1024;

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

    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 500KB 이하여야 합니다." },
        { status: 413 }
      );
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
