"use client";

import { useQuery } from "@tanstack/react-query";
import type { Series } from "@/lib/types/post";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/lib/api/client";

async function fetchSeries(): Promise<Series[]> {
  return apiClient.get<Series[]>("/api/series");
}

interface UseSeriesOptions {
  enabled?: boolean;
}

export function useSeries(options: UseSeriesOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.series.lists(),
    queryFn: fetchSeries,
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
