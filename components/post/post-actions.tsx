"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Share2 } from "lucide-react";
import { SubSlugModal } from "@/components/modals";

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

  const handleShare = async () => {
    const siteUrl = window.location.origin;
    const shareUrl = currentSubSlug
      ? `${siteUrl}/posts/${currentSubSlug}`
      : `${siteUrl}/posts/${postSlug}`;

    try {
      await navigator.clipboard.writeText(shareUrl);

      if (user) {
        setShowSubSlugModal(true);
      } else {
        toast.success("링크가 복사되었습니다");
      }
    } catch {
      toast.error("링크 복사에 실패했습니다");
    }
  };

  const handleSubSlugSuccess = (newSubSlug: string) => {
    setCurrentSubSlug(newSubSlug);
    router.refresh();
  };

  const handleEdit = () => {
    router.push(`/admin/write?id=${postId}`);
  };

  const handleDelete = async () => {
    if (!confirm(`"${postTitle}" 포스트를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      toast.success("포스트가 삭제되었습니다.");
      router.push("/posts");
      router.refresh();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("포스트 삭제 중 오류가 발생했습니다.");
    }
  };

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
