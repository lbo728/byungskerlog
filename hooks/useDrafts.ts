"use client";

import { useQuery } from "@tanstack/react-query";
import type { Draft } from "@/lib/types/post";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/lib/api/client";

async function fetchDrafts(): Promise<Draft[]> {
  return apiClient.get<Draft[]>("/api/drafts");
}

async function fetchDraft(id: string): Promise<Draft> {
  return apiClient.get<Draft>(`/api/drafts/${id}`);
}

interface UseDraftsOptions {
  enabled?: boolean;
}

export function useDrafts(options: UseDraftsOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.drafts.lists(),
    queryFn: fetchDrafts,
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

interface UseDraftOptions {
  enabled?: boolean;
}

export function useDraft(id: string, options: UseDraftOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.drafts.detail(id),
    queryFn: () => fetchDraft(id),
    staleTime: Infinity,
    enabled: enabled && !!id,
  });
}
