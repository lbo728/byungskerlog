"use client";

import { useQuery } from "@tanstack/react-query";
import type { Post } from "@/lib/types/post";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/lib/api/client";

async function fetchPost(id: string): Promise<Post> {
  return apiClient.get<Post>(`/api/posts/${id}`);
}

interface UsePostOptions {
  enabled?: boolean;
}

export function usePost(id: string, options: UsePostOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.posts.detailById(id),
    queryFn: () => fetchPost(id),
    staleTime: Infinity,
    enabled: enabled && !!id,
  });
}
