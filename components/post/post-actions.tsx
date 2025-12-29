"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Share2 } from "lucide-react";
import { SubSlugModal } from "@/components/modals";
import { useDeletePost } from "@/hooks/useDeletePost";
import { useClipboard } from "@/hooks/useClipboard";

interface PostActionsProps {
  postId: string;
  postTitle: string;
  postSlug: string;
  postSubSlug?: string | null;
}

export function PostActions({ postId, postTitle, postSlug, postSubSlug }: PostActionsProps) {
  const user = useUser();
  const router = useRouter();
  const [showSubSlugModal, setShowSubSlugModal] = useState(false);
  const [currentSubSlug, setCurrentSubSlug] = useState(postSubSlug || null);

  const { deletePost } = useDeletePost({ redirectTo: "/posts" });
  const { copy } = useClipboard({
    successMessage: "링크가 복사되었습니다",
    onSuccess: () => {
      if (user) {
        setShowSubSlugModal(true);
      }
    },
  });

  const handleShare = async () => {
    const siteUrl = window.location.origin;
    const shareUrl = currentSubSlug
      ? `${siteUrl}/posts/${currentSubSlug}`
      : `${siteUrl}/posts/${postSlug}`;

    await copy(shareUrl);
  };

  const handleSubSlugSuccess = (newSubSlug: string) => {
    setCurrentSubSlug(newSubSlug);
    router.refresh();
  };

  const handleEdit = () => {
    router.push(`/admin/write?id=${postId}`);
  };

  const handleDelete = () => deletePost(postId, postTitle);

  return (
    <>
      <div className="post-actions flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          공유
        </Button>

        {user && (
          <>
            <Button variant="outline" size="sm" onClick={handleEdit} className="gap-2">
              <Pencil className="h-4 w-4" />
              수정하기
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
              삭제하기
            </Button>
          </>
        )}
      </div>

      {user && (
        <SubSlugModal
          open={showSubSlugModal}
          onOpenChange={setShowSubSlugModal}
          postId={postId}
          currentSubSlug={currentSubSlug}
          onSuccess={handleSubSlugSuccess}
        />
      )}
    </>
  );
}
