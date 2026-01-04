"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { Post } from "@/lib/post-data";

interface PostCacheHydratorProps {
  post: Post;
}

export function PostCacheHydrator({ post }: PostCacheHydratorProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.setQueryData(queryKeys.posts.detailById(post.id), post);
  }, [queryClient, post]);

  return null;
}
