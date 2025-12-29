"use client";

import { useQuery } from "@tanstack/react-query";
import type { Post, HomePost, Pagination } from "@/lib/types";
import { queryKeys } from "@/lib/queryKeys";

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

  const response = await fetch(`/api/posts?${params}`);
  if (!response.ok) throw new Error("Failed to fetch posts");
  return response.json();
}

export function usePosts(options: UsePostsOptions = {}) {
  const { page = 1, limit = 20, sortBy = "latest", initialData, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.posts.list({ page, limit, sortBy }),
    queryFn: () => fetchPosts(page, limit, sortBy),
    initialData,
    staleTime: 5 * 60 * 1000,
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
      const response = await fetch("/api/posts");
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      return data.posts as Post[];
    },
    initialData,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePopularPosts(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.posts.homePopular(),
    queryFn: async () => {
      const response = await fetch("/api/posts?sortBy=popular");
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      return data.posts as Post[];
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
