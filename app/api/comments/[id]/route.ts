import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithAdminCheck } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { isAdmin } = await getAuthUserWithAdminCheck();

    if (!isAdmin) {
      throw ApiError.forbidden("Only admin can delete comments");
    }

    const { id } = await params;

    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, postId: true },
    });

    if (!existingComment) {
      throw ApiError.notFound("Comment");
    }

    const post = await prisma.post.findUnique({
      where: { id: existingComment.postId },
      select: { slug: true, type: true },
    });

    await prisma.comment.delete({
      where: { id },
    });

    if (post) {
      revalidatePath(`/posts/${post.slug}`);
      if (post.type === "SHORT") {
        revalidatePath(`/short/${post.slug}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete comment");
  }
}
