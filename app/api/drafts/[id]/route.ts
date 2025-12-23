import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/drafts/[id] - 특정 임시저장 조회
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const draft = await prisma.draft.findUnique({
      where: { id },
    });

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    if (draft.authorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(draft);
  } catch (error) {
    console.error("Error fetching draft:", error);
    return NextResponse.json({ error: "Failed to fetch draft" }, { status: 500 });
  }
}

// PATCH /api/drafts/[id] - 임시저장 수정
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content, tags } = body;

    const existingDraft = await prisma.draft.findUnique({
      where: { id },
    });

    if (!existingDraft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    if (existingDraft.authorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const draft = await prisma.draft.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(tags !== undefined && { tags }),
      },
    });

    return NextResponse.json(draft);
  } catch (error) {
    console.error("Error updating draft:", error);
    return NextResponse.json({ error: "Failed to update draft" }, { status: 500 });
  }
}

// DELETE /api/drafts/[id] - 임시저장 삭제
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingDraft = await prisma.draft.findUnique({
      where: { id },
    });

    if (!existingDraft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    if (existingDraft.authorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.draft.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting draft:", error);
    return NextResponse.json({ error: "Failed to delete draft" }, { status: 500 });
  }
}
