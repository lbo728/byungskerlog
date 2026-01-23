import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithAdminCheck } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, isAdmin } = await getAuthUserWithAdminCheck();

    if (!isAdmin) {
      throw ApiError.forbidden("Only admin can delete comments");
    }

    const { id } = await params;

    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingComment) {
      throw ApiError.notFound("Comment");
    }

    await prisma.comment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete comment");
  }
}
