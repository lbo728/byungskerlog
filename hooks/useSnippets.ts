"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import type { CustomSnippet, CreateSnippetData, UpdateSnippetData } from "@/lib/types/snippet";

const SNIPPETS_QUERY_KEY = ["snippets"] as const;

export function useSnippets() {
  return useQuery({
    queryKey: SNIPPETS_QUERY_KEY,
    queryFn: () => apiClient.get<CustomSnippet[]>("/api/snippets"),
    staleTime: Infinity,
  });
}

export function useCreateSnippet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSnippetData) => apiClient.post<CustomSnippet>("/api/snippets", data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: SNIPPETS_QUERY_KEY });
      const previousSnippets = queryClient.getQueryData<CustomSnippet[]>(SNIPPETS_QUERY_KEY);

      const optimisticSnippet: CustomSnippet = {
        id: `temp-${Date.now()}`,
        name: newData.name,
        content: newData.content,
        shortcut: newData.shortcut ?? null,
        order: newData.order ?? previousSnippets?.length ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData<CustomSnippet[]>(SNIPPETS_QUERY_KEY, (old) =>
        old ? [...old, optimisticSnippet] : [optimisticSnippet]
      );

      return { previousSnippets };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousSnippets) {
        queryClient.setQueryData(SNIPPETS_QUERY_KEY, context.previousSnippets);
      }
      toast.error(error.message || "스니펫 추가에 실패했습니다.");
    },
    onSuccess: () => {
      toast.success("스니펫이 추가되었습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SNIPPETS_QUERY_KEY });
    },
  });
}

export function useUpdateSnippet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSnippetData }) =>
      apiClient.patch<CustomSnippet>(`/api/snippets/${id}`, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: SNIPPETS_QUERY_KEY });
      const previousSnippets = queryClient.getQueryData<CustomSnippet[]>(SNIPPETS_QUERY_KEY);

      queryClient.setQueryData<CustomSnippet[]>(SNIPPETS_QUERY_KEY, (old) =>
        old?.map((snippet) => (snippet.id === id ? { ...snippet, ...data, updatedAt: new Date() } : snippet))
      );

      return { previousSnippets };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousSnippets) {
        queryClient.setQueryData(SNIPPETS_QUERY_KEY, context.previousSnippets);
      }
      toast.error(error.message || "스니펫 수정에 실패했습니다.");
    },
    onSuccess: () => {
      toast.success("스니펫이 수정되었습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SNIPPETS_QUERY_KEY });
    },
  });
}

export function useDeleteSnippet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/snippets/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: SNIPPETS_QUERY_KEY });
      const previousSnippets = queryClient.getQueryData<CustomSnippet[]>(SNIPPETS_QUERY_KEY);

      queryClient.setQueryData<CustomSnippet[]>(SNIPPETS_QUERY_KEY, (old) =>
        old?.filter((snippet) => snippet.id !== id)
      );

      return { previousSnippets };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousSnippets) {
        queryClient.setQueryData(SNIPPETS_QUERY_KEY, context.previousSnippets);
      }
      toast.error(error.message || "스니펫 삭제에 실패했습니다.");
    },
    onSuccess: () => {
      toast.success("스니펫이 삭제되었습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SNIPPETS_QUERY_KEY });
    },
  });
}
