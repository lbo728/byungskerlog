"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { fetchComments, createComment, deleteComment, toggleReaction } from "@/lib/api/comments";
import type { Comment, CommentsResponse, CreateCommentInput, ReactionType } from "@/lib/types/comment";

interface UseCommentsOptions {
  enabled?: boolean;
  visitorId?: string;
}

export function useComments(postId: string, options: UseCommentsOptions = {}) {
  const { enabled = true, visitorId } = options;

  return useQuery({
    queryKey: queryKeys.comments.list(postId),
    queryFn: () => fetchComments(postId, visitorId),
    staleTime: 30 * 1000,
    enabled: enabled && !!postId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComment,
    onMutate: async (newComment: CreateCommentInput) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.comments.list(newComment.postId) });

      const previousData = queryClient.getQueryData<CommentsResponse>(queryKeys.comments.list(newComment.postId));

      const optimisticComment: Comment = {
        id: `temp_${Date.now()}`,
        postId: newComment.postId,
        content: newComment.content,
        authorId: newComment.anonymousId || "",
        authorName: newComment.authorName || null,
        authorImage: newComment.authorImage || null,
        parentId: newComment.parentId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reactions: [],
        replies: [],
      };

      if (previousData) {
        if (newComment.parentId) {
          const addReplyToComment = (comments: Comment[]): Comment[] => {
            return comments.map((comment) => {
              if (comment.id === newComment.parentId) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), optimisticComment],
                };
              }
              if (comment.replies) {
                return { ...comment, replies: addReplyToComment(comment.replies) };
              }
              return comment;
            });
          };

          queryClient.setQueryData<CommentsResponse>(queryKeys.comments.list(newComment.postId), {
            ...previousData,
            comments: addReplyToComment(previousData.comments),
            total: previousData.total + 1,
          });
        } else {
          queryClient.setQueryData<CommentsResponse>(queryKeys.comments.list(newComment.postId), {
            ...previousData,
            comments: [...previousData.comments, optimisticComment],
            total: previousData.total + 1,
          });
        }
      }

      return { previousData, postId: newComment.postId };
    },
    onError: (_err, newComment, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.comments.list(newComment.postId), context.previousData);
      }
      toast.error("댓글 작성에 실패했습니다. 다시 시도해주세요.");
    },
    onSuccess: () => {
      toast.success("댓글이 작성되었습니다.");
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(variables.postId) });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; postId: string }) => deleteComment(id),
    onMutate: async ({ id, postId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.comments.list(postId) });

      const previousData = queryClient.getQueryData<CommentsResponse>(queryKeys.comments.list(postId));

      if (previousData) {
        const removeCommentFromList = (comments: Comment[]): Comment[] => {
          return comments
            .filter((comment) => comment.id !== id)
            .map((comment) => {
              if (comment.replies) {
                return { ...comment, replies: removeCommentFromList(comment.replies) };
              }
              return comment;
            });
        };

        queryClient.setQueryData<CommentsResponse>(queryKeys.comments.list(postId), {
          ...previousData,
          comments: removeCommentFromList(previousData.comments),
          total: previousData.total - 1,
        });
      }

      return { previousData, postId };
    },
    onError: (_err, { postId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.comments.list(postId), context.previousData);
      }
    },
    onSettled: (_data, _error, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(postId) });
    },
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      type,
      visitorId,
    }: {
      commentId: string;
      type: ReactionType;
      postId: string;
      visitorId: string;
    }) => toggleReaction(commentId, { type, visitorId }),
    onMutate: async ({ commentId, type, postId, visitorId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.comments.list(postId) });

      const previousData = queryClient.getQueryData<CommentsResponse>(queryKeys.comments.list(postId));

      if (previousData) {
        const updateReactionInList = (comments: Comment[]): Comment[] => {
          return comments.map((comment) => {
            if (comment.id === commentId) {
              const existingReaction = comment.reactions.find((r) => r.type === type);

              if (existingReaction?.userReacted) {
                return {
                  ...comment,
                  reactions: comment.reactions.map((r) =>
                    r.type === type ? { ...r, count: r.count - 1, userReacted: false } : r
                  ),
                };
              } else if (existingReaction) {
                return {
                  ...comment,
                  reactions: comment.reactions.map((r) =>
                    r.type === type ? { ...r, count: r.count + 1, userReacted: true } : r
                  ),
                };
              } else {
                return {
                  ...comment,
                  reactions: [...comment.reactions, { type, count: 1, userReacted: true }],
                };
              }
            }
            if (comment.replies) {
              return { ...comment, replies: updateReactionInList(comment.replies) };
            }
            return comment;
          });
        };

        queryClient.setQueryData<CommentsResponse>(queryKeys.comments.list(postId), {
          ...previousData,
          comments: updateReactionInList(previousData.comments),
        });
      }

      return { previousData, postId };
    },
    onError: (_err, { postId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.comments.list(postId), context.previousData);
      }
    },
    onSettled: (_data, _error, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(postId) });
    },
  });
}
