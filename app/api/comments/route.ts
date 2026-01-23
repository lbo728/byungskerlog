import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";
import type { Comment, CommentReactionCount } from "@/lib/types/comment";
import type { ReactionType } from "@prisma/client";

function groupReactions(
  reactions: { type: ReactionType; userId: string }[],
  currentUserId: string | null
): CommentReactionCount[] {
  const grouped = reactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.type]) {
        acc[reaction.type] = { count: 0, userReacted: false };
      }
      acc[reaction.type].count++;
      if (reaction.userId === currentUserId) {
        acc[reaction.type].userReacted = true;
      }
      return acc;
    },
    {} as Record<ReactionType, { count: number; userReacted: boolean }>
  );

  return Object.entries(grouped).map(([type, data]) => ({
    type: type as ReactionType,
    count: data.count,
    userReacted: data.userReacted,
  }));
}

function transformComment(
  comment: {
    id: string;
    content: string;
    postId: string;
    authorId: string;
    authorName: string | null;
    authorImage: string | null;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
    reactions: { type: ReactionType; userId: string }[];
    replies?: {
      id: string;
      content: string;
      postId: string;
      authorId: string;
      authorName: string | null;
      authorImage: string | null;
      parentId: string | null;
      createdAt: Date;
      updatedAt: Date;
      reactions: { type: ReactionType; userId: string }[];
      _count: { replies: number };
    }[];
    _count: { replies: number };
  },
  currentUserId: string | null
): Comment {
  return {
    id: comment.id,
    content: comment.content,
    postId: comment.postId,
    authorId: comment.authorId,
    authorName: comment.authorName,
    authorImage: comment.authorImage,
    parentId: comment.parentId,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    reactions: groupReactions(comment.reactions, currentUserId),
    replies: comment.replies?.map((reply) => transformComment(reply, currentUserId)),
    _count: comment._count,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const visitorId = searchParams.get("visitorId");

    if (!postId) {
      throw ApiError.badRequest("postId is required");
    }

    const user = await getAuthUser();
    const currentUserId = user?.id || visitorId || null;

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentId: null,
      },
      include: {
        reactions: {
          select: {
            type: true,
            userId: true,
          },
        },
        replies: {
          include: {
            reactions: {
              select: {
                type: true,
                userId: true,
              },
            },
            _count: {
              select: { replies: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.comment.count({
      where: { postId },
    });

    const transformedComments = comments.map((comment) => transformComment(comment, currentUserId));

    return NextResponse.json({
      comments: transformedComments,
      total,
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch comments");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, postId, parentId, authorName, authorImage, anonymousId } = body;

    if (!content?.trim()) {
      throw ApiError.validationError("Content is required");
    }

    if (!postId) {
      throw ApiError.validationError("postId is required");
    }

    if (!authorName?.trim()) {
      throw ApiError.validationError("authorName is required");
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, published: true },
    });

    if (!post) {
      throw ApiError.notFound("Post");
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, postId: true },
      });

      if (!parentComment) {
        throw ApiError.notFound("Parent comment");
      }

      if (parentComment.postId !== postId) {
        throw ApiError.badRequest("Parent comment does not belong to this post");
      }
    }

    const user = await getAuthUser();
    const finalAuthorId = user?.id || anonymousId || `anon_${Date.now()}`;
    const finalAuthorName = user?.displayName || authorName.trim();
    const finalAuthorImage = user?.profileImageUrl || authorImage || null;

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId,
        authorId: finalAuthorId,
        authorName: finalAuthorName,
        authorImage: finalAuthorImage,
        parentId: parentId || null,
      },
      include: {
        reactions: {
          select: {
            type: true,
            userId: true,
          },
        },
        _count: {
          select: { replies: true },
        },
      },
    });

    const transformedComment = transformComment(comment, finalAuthorId);

    return NextResponse.json(transformedComment, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create comment");
  }
}
