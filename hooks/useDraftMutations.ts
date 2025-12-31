"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Draft } from "@/lib/types/post";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/lib/api/client";

async function deleteDraft(id: string): Promise<void> {
  await apiClient.delete(`/api/drafts/${id}`);
}

export function useDeleteDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDraft,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.drafts.lists() });

      const previousDrafts = queryClient.getQueryData<Draft[]>(
        queryKeys.drafts.lists()
      );

      queryClient.setQueryData<Draft[]>(queryKeys.drafts.lists(), (old) =>
        old?.filter((d) => d.id !== id)
      );

      return { previousDrafts };
    },
    onError: (_err, _id, context) => {
      if (context?.previousDrafts) {
        queryClient.setQueryData(
          queryKeys.drafts.lists(),
          context.previousDrafts
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts.all });
    },
  });
}
