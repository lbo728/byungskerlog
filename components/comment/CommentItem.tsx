"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { CommentForm } from "./CommentForm";
import { CommentReactions } from "./CommentReactions";
import type { Comment, ReactionType } from "@/lib/types/comment";
import type { AnonymousIdentity } from "@/lib/comment-identity";
import { MoreHorizontal, Trash2, MessageSquare } from "lucide-react";

interface CommentItemProps {
  comment: Comment;
  postId: string;
  isAdmin: boolean;
  onReply: (parentId: string, content: string, identity: AnonymousIdentity) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReact: (commentId: string, type: ReactionType) => void;
  depth?: number;
}

export function CommentItem({ comment, postId, isAdmin, onReply, onDelete, onReact, depth = 0 }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxDepth = 3;

  const handleReply = async (content: string, identity: AnonymousIdentity) => {
    setIsSubmitting(true);
    try {
      await onReply(comment.id, content, identity);
      setIsReplying(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    await onDelete(comment.id);
  };

  const isEmoji = comment.authorImage && /^\p{Emoji}/u.test(comment.authorImage);

  return (
    <div className={cn("comment-item", depth > 0 && "ml-6 pl-4 border-l-2 border-muted")} data-comment-id={comment.id}>
      <div className="comment-content py-4">
        <div className="comment-header flex items-start justify-between">
          <div className="comment-author flex items-center gap-3">
            {isEmoji ? (
              <div className="comment-avatar-emoji h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-xl">
                {comment.authorImage}
              </div>
            ) : comment.authorImage ? (
              <img
                src={comment.authorImage}
                alt={comment.authorName || "User"}
                className="comment-avatar h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="comment-avatar-placeholder h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                {(comment.authorName || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="comment-meta">
              <span className="comment-author-name font-medium text-sm">{comment.authorName || "Anonymous"}</span>
              <span className="comment-time text-xs text-muted-foreground ml-2">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </span>
            </div>
          </div>

          {isAdmin && (
            <div className="comment-actions-menu relative">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowActions(!showActions)}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {showActions && (
                <div className="comment-actions-dropdown absolute right-0 top-full mt-1 bg-background border rounded-lg shadow-lg py-1 z-10 min-w-[100px]">
                  <button
                    onClick={() => {
                      handleDelete();
                      setShowActions(false);
                    }}
                    className="comment-action-delete flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    삭제
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="comment-body mt-3">
          <p className="comment-text text-sm whitespace-pre-wrap leading-relaxed">{comment.content}</p>
        </div>

        <div className="comment-footer mt-3 flex items-center gap-4">
          <CommentReactions reactions={comment.reactions} onReact={(type) => onReact(comment.id, type)} />

          {depth < maxDepth && (
            <Button
              variant="ghost"
              size="sm"
              className="comment-reply-btn h-7 px-2 text-xs text-muted-foreground"
              onClick={() => setIsReplying(!isReplying)}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              답글
            </Button>
          )}
        </div>

        {isReplying && (
          <div className="comment-reply-form mt-4">
            <CommentForm
              onSubmit={handleReply}
              placeholder="답글을 입력하세요..."
              submitLabel="답글 작성"
              onCancel={() => setIsReplying(false)}
              autoFocus
              isSubmitting={isSubmitting}
              compact
            />
          </div>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              isAdmin={isAdmin}
              onReply={onReply}
              onDelete={onDelete}
              onReact={onReact}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
