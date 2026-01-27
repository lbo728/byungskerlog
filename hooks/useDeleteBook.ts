"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UseDeleteBookOptions {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function useDeleteBook(options: UseDeleteBookOptions = {}) {
  const router = useRouter();
  const { onSuccess, redirectTo } = options;

  const deleteBook = async (bookId: string, bookTitle: string) => {
    if (!confirm(`"${bookTitle}" 책을 삭제하시겠습니까?`)) {
      return false;
    }

    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete book");
      }

      toast.success("책이 삭제되었습니다.");

      if (redirectTo) {
        router.push(redirectTo);
      }

      router.refresh();
      onSuccess?.();

      return true;
    } catch (error) {
      console.error("Error deleting book:", error);
      toast.error("책 삭제 중 오류가 발생했습니다.");
      return false;
    }
  };

  return { deleteBook };
}
