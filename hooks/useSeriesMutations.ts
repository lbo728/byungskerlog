"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Series } from "@/lib/types/post";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/lib/api/client";

interface CreateSeriesInput {
  name: string;
  slug?: string;
  description?: string;
}

interface UpdateSeriesInput {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
}

async function createSeries(input: CreateSeriesInput): Promise<Series> {
  return apiClient.post<Series>("/api/series", input);
}

async function updateSeries({ id, ...data }: UpdateSeriesInput): Promise<Series> {
  return apiClient.patch<Series>(`/api/series/${id}`, data);
}

async function deleteSeries(id: string): Promise<void> {
  await apiClient.delete(`/api/series/${id}`);
}

export function useCreateSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSeries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.series.all });
    },
  });
}

export function useUpdateSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSeries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.series.all });
    },
  });
}

export function useDeleteSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSeries,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.series.lists() });

      const previousSeries = queryClient.getQueryData<Series[]>(
        queryKeys.series.lists()
      );

      queryClient.setQueryData<Series[]>(queryKeys.series.lists(), (old) =>
        old?.filter((s) => s.id !== id)
      );

      return { previousSeries };
    },
    onError: (_err, _id, context) => {
      if (context?.previousSeries) {
        queryClient.setQueryData(
          queryKeys.series.lists(),
          context.previousSeries
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.series.all });
    },
  });
}
