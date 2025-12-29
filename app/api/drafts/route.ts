import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const drafts = await prisma.draft.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(drafts);
  } catch (error) {
    return handleApiError(error, "Failed to fetch drafts");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const body = await request.json();
    const { title, content, tags } = body;

    const draft = await prisma.draft.create({
      data: {
        title: title || "",
        content: content || "",
        tags: tags || [],
        authorId: user.id,
      },
    });

    return NextResponse.json(draft, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create draft");
  }
}
