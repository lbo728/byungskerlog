"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/lib/api/client";

type BulkAction = "delete" | "publish" | "unpublish";

interface BulkActionParams {
  action: BulkAction;
  postIds: string[];
}

interface BulkActionResponse {
  message: string;
  count: number;
}

interface MutationOptions {
  onSuccess?: (count: number) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

export function useBulkPostAction(options: MutationOptions = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { onSuccess, onError, showToast = true } = options;

  return useMutation({
    mutationFn: ({ action, postIds }: BulkActionParams) =>
      apiClient.post<BulkActionResponse>("/api/posts/bulk", { action, postIds }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shortPosts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });

      if (showToast) {
        const actionMessages: Record<BulkAction, string> = {
          delete: `${data.count}개의 포스트가 삭제되었습니다.`,
          publish: `${data.count}개의 포스트가 공개되었습니다.`,
          unpublish: `${data.count}개의 포스트가 비공개 처리되었습니다.`,
        };
        toast.success(actionMessages[variables.action]);
      }

      router.refresh();
      onSuccess?.(data.count);
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || "작업 중 오류가 발생했습니다.");
      }
      onError?.(error);
    },
  });
}
