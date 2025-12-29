import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const { id } = await params;

    const draft = await prisma.draft.findUnique({
      where: { id },
    });

    if (!draft) {
      throw ApiError.notFound("Draft");
    }

    if (draft.authorId !== user.id) {
      throw ApiError.forbidden();
    }

    return NextResponse.json(draft);
  } catch (error) {
    return handleApiError(error, "Failed to fetch draft");
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content, tags } = body;

    const existingDraft = await prisma.draft.findUnique({
      where: { id },
    });

    if (!existingDraft) {
      throw ApiError.notFound("Draft");
    }

    if (existingDraft.authorId !== user.id) {
      throw ApiError.forbidden();
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
    return handleApiError(error, "Failed to update draft");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const { id } = await params;

    const existingDraft = await prisma.draft.findUnique({
      where: { id },
    });

    if (!existingDraft) {
      throw ApiError.notFound("Draft");
    }

    if (existingDraft.authorId !== user.id) {
      throw ApiError.forbidden();
    }

    await prisma.draft.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete draft");
  }
}
