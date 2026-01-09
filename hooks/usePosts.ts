"use client";

import { useQuery } from "@tanstack/react-query";
import type { Post, HomePost } from "@/lib/types/post";
import type { Pagination } from "@/lib/types/api";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/lib/api/client";

export type { Post, HomePost };

export interface PostsData {
  posts: Post[];
  pagination: Pagination;
}

interface UsePostsOptions {
  page?: number;
  limit?: number;
  sortBy?: "latest" | "popular";
  initialData?: PostsData;
  enabled?: boolean;
}

async function fetchPosts(page: number, limit: number, sortBy?: string): Promise<PostsData> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (sortBy) {
    params.set("sortBy", sortBy);
  }

  return apiClient.get<PostsData>(`/api/posts?${params}`);
}

export function usePosts(options: UsePostsOptions = {}) {
  const { page = 1, limit = 20, sortBy = "latest", initialData, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.posts.list({ page, limit, sortBy }),
    queryFn: () => fetchPosts(page, limit, sortBy),
    initialData,
    staleTime: 60 * 60 * 1000, // 1시간
    refetchOnMount: !initialData, // initialData가 있으면 마운트 시 리패칭 안함
    refetchOnWindowFocus: false,
    enabled,
  });
}

interface UseHomePostsOptions {
  initialData?: Post[];
}

export function useHomePosts(options: UseHomePostsOptions = {}) {
  const { initialData } = options;

  return useQuery({
    queryKey: queryKeys.posts.homeLatest(),
    queryFn: async () => {
      const data = await apiClient.get<PostsData>("/api/posts");
      return data.posts;
    },
    initialData,
    staleTime: 60 * 60 * 1000, // 1시간
    refetchOnMount: !initialData,
    refetchOnWindowFocus: false,
  });
}

export function usePopularPosts(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.posts.homePopular(),
    queryFn: async () => {
      const data = await apiClient.get<PostsData>("/api/posts?sortBy=popular");
      return data.posts;
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
