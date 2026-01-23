import type { ReactionType } from "@prisma/client";

export type { ReactionType } from "@prisma/client";

export interface CommentAuthor {
  id: string;
  name: string | null;
  image: string | null;
}

export interface CommentReaction {
  id: string;
  type: ReactionType;
  userId: string;
  createdAt: string;
}

export interface CommentReactionCount {
  type: ReactionType;
  count: number;
  userReacted: boolean;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  authorName: string | null;
  authorImage: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
  reactions: CommentReactionCount[];
  _count?: {
    replies: number;
  };
}

export interface CreateCommentInput {
  content: string;
  postId: string;
  parentId?: string | null;
  authorName: string;
  authorImage?: string | null;
  anonymousId?: string;
}

export interface UpdateCommentInput {
  content: string;
}

export interface ToggleReactionInput {
  type: ReactionType;
  visitorId?: string;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
}
