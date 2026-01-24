import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";
import { ReactionType } from "@prisma/client";

const VALID_REACTION_TYPES: ReactionType[] = ["LIKE", "LOVE", "CELEBRATE", "INSIGHTFUL"];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: commentId } = await params;
    const body = await request.json();
    const { type, visitorId } = body;

    if (!type || !VALID_REACTION_TYPES.includes(type)) {
      throw ApiError.validationError("Invalid reaction type");
    }

    const user = await getAuthUser();
    const userId = user?.id || visitorId;

    if (!userId) {
      throw ApiError.validationError("visitorId is required for anonymous reactions");
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });

    if (!comment) {
      throw ApiError.notFound("Comment");
    }

    const existingReaction = await prisma.commentReaction.findUnique({
      where: {
        commentId_userId_type: {
          commentId,
          userId,
          type,
        },
      },
    });

    if (existingReaction) {
      await prisma.commentReaction.delete({
        where: { id: existingReaction.id },
      });

      return NextResponse.json({
        action: "removed",
        type,
      });
    }

    await prisma.commentReaction.create({
      data: {
        commentId,
        userId,
        type,
      },
    });

    return NextResponse.json({
      action: "added",
      type,
    });
  } catch (error) {
    return handleApiError(error, "Failed to toggle reaction");
  }
}
