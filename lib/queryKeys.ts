export interface PostListFilters {
  page: number;
  limit: number;
  sortBy: string;
}

export const queryKeys = {
  posts: {
    all: ["posts"] as const,
    lists: () => [...queryKeys.posts.all, "list"] as const,
    list: (filters: PostListFilters) =>
      [...queryKeys.posts.lists(), filters.page, filters.limit, filters.sortBy] as const,
    home: () => [...queryKeys.posts.all, "home"] as const,
    homeLatest: () => [...queryKeys.posts.home(), "latest"] as const,
    homePopular: () => [...queryKeys.posts.home(), "popular"] as const,
    byTag: (tag: string | null) => [...queryKeys.posts.all, "by-tag", tag] as const,
    details: () => [...queryKeys.posts.all, "detail"] as const,
    detail: (slug: string) => [...queryKeys.posts.details(), slug] as const,
  },

  shortPosts: {
    all: ["short-posts"] as const,
    lists: () => [...queryKeys.shortPosts.all, "list"] as const,
    list: (page: number) => [...queryKeys.shortPosts.lists(), page] as const,
  },

  tags: {
    all: ["tags"] as const,
  },

  visitors: {
    all: ["visitor-stats"] as const,
  },

  drafts: {
    all: ["drafts"] as const,
    lists: () => [...queryKeys.drafts.all, "list"] as const,
    detail: (id: string) => [...queryKeys.drafts.all, "detail", id] as const,
  },

  series: {
    all: ["series"] as const,
    lists: () => [...queryKeys.series.all, "list"] as const,
    detail: (slug: string) => [...queryKeys.series.all, "detail", slug] as const,
  },
} as const;
