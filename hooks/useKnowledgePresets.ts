"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { queryKeys } from "@/lib/queryKeys";
import type {
  AIKnowledgePresetWithReferences,
  CreatePresetData,
  UpdatePresetData,
  CreateReferenceData,
  UpdateReferenceData,
  AIKnowledgeReference,
} from "@/lib/types/ai-knowledge";

export function useKnowledgePresets() {
  return useQuery({
    queryKey: queryKeys.knowledgePresets.lists(),
    queryFn: () => apiClient.get<AIKnowledgePresetWithReferences[]>("/api/ai-knowledge-presets"),
    staleTime: Infinity,
  });
}

export function useKnowledgePreset(id: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.knowledgePresets.detail(id),
    queryFn: () => apiClient.get<AIKnowledgePresetWithReferences>(`/api/ai-knowledge-presets/${id}`),
    staleTime: Infinity,
    enabled: !!id && options.enabled !== false,
  });
}

export function useCreatePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePresetData) =>
      apiClient.post<AIKnowledgePresetWithReferences>("/api/ai-knowledge-presets", data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.knowledgePresets.all });
      const previousPresets = queryClient.getQueryData<AIKnowledgePresetWithReferences[]>(
        queryKeys.knowledgePresets.lists()
      );

      const optimisticPreset: AIKnowledgePresetWithReferences = {
        id: `temp-${Date.now()}`,
        name: newData.name,
        instruction: newData.instruction,
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        references: [],
      };

      queryClient.setQueryData<AIKnowledgePresetWithReferences[]>(queryKeys.knowledgePresets.lists(), (old) =>
        old ? [optimisticPreset, ...old] : [optimisticPreset]
      );

      return { previousPresets };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousPresets) {
        queryClient.setQueryData(queryKeys.knowledgePresets.lists(), context.previousPresets);
      }
      toast.error(error.message || "프리셋 추가에 실패했습니다.");
    },
    onSuccess: () => {
      toast.success("프리셋이 추가되었습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledgePresets.all });
    },
  });
}

export function useUpdatePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePresetData }) =>
      apiClient.patch<AIKnowledgePresetWithReferences>(`/api/ai-knowledge-presets/${id}`, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.knowledgePresets.all });
      const previousPresets = queryClient.getQueryData<AIKnowledgePresetWithReferences[]>(
        queryKeys.knowledgePresets.lists()
      );

      queryClient.setQueryData<AIKnowledgePresetWithReferences[]>(queryKeys.knowledgePresets.lists(), (old) =>
        old?.map((preset) => (preset.id === id ? { ...preset, ...data, updatedAt: new Date() } : preset))
      );

      return { previousPresets };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousPresets) {
        queryClient.setQueryData(queryKeys.knowledgePresets.lists(), context.previousPresets);
      }
      toast.error(error.message || "프리셋 수정에 실패했습니다.");
    },
    onSuccess: () => {
      toast.success("프리셋이 수정되었습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledgePresets.all });
    },
  });
}

export function useDeletePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/ai-knowledge-presets/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.knowledgePresets.all });
      const previousPresets = queryClient.getQueryData<AIKnowledgePresetWithReferences[]>(
        queryKeys.knowledgePresets.lists()
      );

      queryClient.setQueryData<AIKnowledgePresetWithReferences[]>(queryKeys.knowledgePresets.lists(), (old) =>
        old?.filter((preset) => preset.id !== id)
      );

      return { previousPresets };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousPresets) {
        queryClient.setQueryData(queryKeys.knowledgePresets.lists(), context.previousPresets);
      }
      toast.error(error.message || "프리셋 삭제에 실패했습니다.");
    },
    onSuccess: () => {
      toast.success("프리셋이 삭제되었습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledgePresets.all });
    },
  });
}

export function useCreateReference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ presetId, data }: { presetId: string; data: CreateReferenceData }) =>
      apiClient.post<AIKnowledgeReference>(`/api/ai-knowledge-presets/${presetId}/references`, data),
    onSuccess: () => {
      toast.success("참고 컨텐츠가 추가되었습니다.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "참고 컨텐츠 추가에 실패했습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledgePresets.all });
    },
  });
}

export function useUpdateReference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ presetId, refId, data }: { presetId: string; refId: string; data: UpdateReferenceData }) =>
      apiClient.patch<AIKnowledgeReference>(`/api/ai-knowledge-presets/${presetId}/references/${refId}`, data),
    onSuccess: () => {
      toast.success("참고 컨텐츠가 수정되었습니다.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "참고 컨텐츠 수정에 실패했습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledgePresets.all });
    },
  });
}

export function useDeleteReference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ presetId, refId }: { presetId: string; refId: string }) =>
      apiClient.delete(`/api/ai-knowledge-presets/${presetId}/references/${refId}`),
    onSuccess: () => {
      toast.success("참고 컨텐츠가 삭제되었습니다.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "참고 컨텐츠 삭제에 실패했습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledgePresets.all });
    },
  });
}
