"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import { useComments, useCreateComment, useDeleteComment, useToggleReaction } from "@/hooks/useComments";
import { getOrCreateAnonymousId, type AnonymousIdentity } from "@/lib/comment-identity";
import type { ReactionType } from "@/lib/types/comment";
import { MessageSquare } from "lucide-react";

interface CommentListProps {
  postId: string;
  isAdmin?: boolean;
}

export function CommentList({ postId, isAdmin = false }: CommentListProps) {
  const [anonymousId, setAnonymousId] = useState<string>("");
  const { data, isLoading, error } = useComments(postId, { visitorId: anonymousId });
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const toggleReaction = useToggleReaction();

  useEffect(() => {
    const id = getOrCreateAnonymousId();
    setAnonymousId(id);
  }, []);

  const handleCreateComment = async (content: string, identity: AnonymousIdentity) => {
    await createComment.mutateAsync({
      content,
      postId,
      authorName: identity.nickname,
      authorImage: identity.avatar,
      anonymousId,
    });
  };

  const handleReply = async (parentId: string, content: string, identity: AnonymousIdentity) => {
    await createComment.mutateAsync({
      content,
      postId,
      parentId,
      authorName: identity.nickname,
      authorImage: identity.avatar,
      anonymousId,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteComment.mutateAsync({ id, postId });
      toast.success("댓글이 삭제되었습니다.");
    } catch {
      toast.error("댓글 삭제에 실패했습니다.");
    }
  };

  const handleReact = (commentId: string, type: ReactionType) => {
    if (!anonymousId) {
      toast.error("잠시 후 다시 시도해주세요.");
      return;
    }

    toggleReaction.mutate({
      commentId,
      type,
      postId,
      visitorId: anonymousId,
    });
  };

  if (isLoading) {
    return <div className="comment-loading py-8 text-center text-muted-foreground">댓글을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="comment-error py-8 text-center text-destructive">댓글을 불러오는데 실패했습니다.</div>;
  }

  const comments = data?.comments || [];
  const total = data?.total || 0;

  return (
    <div className="comment-section">
      <div className="comment-header flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5" />
        <h2 className="text-lg font-semibold">댓글</h2>
        <span className="text-muted-foreground text-sm">({total})</span>
      </div>

      <div className="comment-form-wrapper mb-8">
        <CommentForm onSubmit={handleCreateComment} isSubmitting={createComment.isPending} />
      </div>

      {comments.length === 0 ? (
        <div className="comment-empty py-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">아직 댓글이 없습니다.</p>
          <p className="text-sm text-muted-foreground/70 mt-1">첫 번째 댓글을 남겨보세요!</p>
        </div>
      ) : (
        <div className="comment-list divide-y">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              isAdmin={isAdmin}
              onReply={handleReply}
              onDelete={handleDelete}
              onReact={handleReact}
            />
          ))}
        </div>
      )}
    </div>
  );
}
