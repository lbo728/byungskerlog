"use client";

import { useQuery } from "@tanstack/react-query";
import type { ShortPost, Pagination } from "@/lib/types";

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
  const response = await fetch(`/api/posts?page=${page}&limit=${limit}&type=SHORT`);
  if (!response.ok) throw new Error("Failed to fetch short posts");
  return response.json();
}

export function useShortPosts(options: UseShortPostsOptions = {}) {
  const { page = 1, limit = 20, initialData } = options;

  return useQuery({
    queryKey: ["short-posts", "list", page],
    queryFn: () => fetchShortPosts(page, limit),
    initialData,
    staleTime: 5 * 60 * 1000,
  });
}
