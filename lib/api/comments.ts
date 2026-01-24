import { apiClient } from "./client";
import type { Comment, CommentsResponse, CreateCommentInput, ToggleReactionInput } from "@/lib/types/comment";

export async function fetchComments(postId: string, visitorId?: string): Promise<CommentsResponse> {
  const params = new URLSearchParams({ postId });
  if (visitorId) {
    params.append("visitorId", visitorId);
  }
  return apiClient.get<CommentsResponse>(`/api/comments?${params.toString()}`);
}

export async function createComment(data: CreateCommentInput): Promise<Comment> {
  return apiClient.post<Comment, CreateCommentInput>("/api/comments", data);
}

export async function deleteComment(id: string): Promise<void> {
  return apiClient.delete(`/api/comments/${id}`);
}

export async function toggleReaction(
  commentId: string,
  data: ToggleReactionInput
): Promise<{ action: "added" | "removed"; type: string }> {
  return apiClient.post(`/api/comments/${commentId}/reactions`, data);
}
