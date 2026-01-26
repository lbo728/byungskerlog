"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Draft } from "@/lib/types/post";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/lib/api/client";

async function deleteDraft(id: string): Promise<void> {
  await apiClient.delete(`/api/drafts/${id}`);
}

interface BatchDeleteResponse {
  success: boolean;
  deletedCount: number;
}

async function deleteMultipleDrafts(ids: string[]): Promise<BatchDeleteResponse> {
  return apiClient.delete<BatchDeleteResponse>("/api/drafts", { ids });
}

async function deleteAllDrafts(): Promise<BatchDeleteResponse> {
  return apiClient.delete<BatchDeleteResponse>("/api/drafts", { deleteAll: true });
}

export function useDeleteDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDraft,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.drafts.lists() });

      const previousDrafts = queryClient.getQueryData<Draft[]>(queryKeys.drafts.lists());

      queryClient.setQueryData<Draft[]>(queryKeys.drafts.lists(), (old) => old?.filter((d) => d.id !== id));

      return { previousDrafts };
    },
    onError: (_err, _id, context) => {
      if (context?.previousDrafts) {
        queryClient.setQueryData(queryKeys.drafts.lists(), context.previousDrafts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts.all });
    },
  });
}

export function useDeleteMultipleDrafts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMultipleDrafts,
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.drafts.lists() });

      const previousDrafts = queryClient.getQueryData<Draft[]>(queryKeys.drafts.lists());

      queryClient.setQueryData<Draft[]>(queryKeys.drafts.lists(), (old) => old?.filter((d) => !ids.includes(d.id)));

      return { previousDrafts };
    },
    onError: (_err, _ids, context) => {
      if (context?.previousDrafts) {
        queryClient.setQueryData(queryKeys.drafts.lists(), context.previousDrafts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts.all });
    },
  });
}

export function useDeleteAllDrafts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllDrafts,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.drafts.lists() });

      const previousDrafts = queryClient.getQueryData<Draft[]>(queryKeys.drafts.lists());

      queryClient.setQueryData<Draft[]>(queryKeys.drafts.lists(), () => []);

      return { previousDrafts };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDrafts) {
        queryClient.setQueryData(queryKeys.drafts.lists(), context.previousDrafts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts.all });
    },
  });
}
