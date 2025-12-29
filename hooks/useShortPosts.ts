"use client";

import { useQuery } from "@tanstack/react-query";
import type { ShortPost, Pagination } from "@/lib/types";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/lib/api";

export type { ShortPost };

export interface ShortPostsData {
  posts: ShortPost[];
  pagination: Pagination;
}

interface UseShortPostsOptions {
  page?: number;
  limit?: number;
  initialData?: ShortPostsData;
}

async function fetchShortPosts(page: number, limit: number): Promise<ShortPostsData> {
  return apiClient.get<ShortPostsData>(`/api/posts?page=${page}&limit=${limit}&type=SHORT`);
}

export function useShortPosts(options: UseShortPostsOptions = {}) {
  const { page = 1, limit = 20, initialData } = options;

  return useQuery({
    queryKey: queryKeys.shortPosts.list(page),
    queryFn: () => fetchShortPosts(page, limit),
    initialData,
    staleTime: 5 * 60 * 1000,
  });
}
