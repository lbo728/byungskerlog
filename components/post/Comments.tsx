"use client";

import { CommentList } from "@/components/comment/CommentList";

interface CommentsProps {
  postId: string;
  isAdmin?: boolean;
}

export function Comments({ postId, isAdmin = false }: CommentsProps) {
  return (
    <section className="comments-section mt-12">
      <CommentList postId={postId} isAdmin={isAdmin} />
    </section>
  );
}
