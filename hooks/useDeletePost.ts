"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UseDeletePostOptions {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function useDeletePost(options: UseDeletePostOptions = {}) {
  const router = useRouter();
  const { onSuccess, redirectTo } = options;

  const deletePost = async (postId: string, postTitle: string) => {
    if (!confirm(`"${postTitle}" 포스트를 삭제하시겠습니까?`)) {
      return false;
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      toast.success("포스트가 삭제되었습니다.");

      if (redirectTo) {
        router.push(redirectTo);
      }

      router.refresh();
      onSuccess?.();

      return true;
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("포스트 삭제 중 오류가 발생했습니다.");
      return false;
    }
  };

  return { deletePost };
}
