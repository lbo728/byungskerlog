import { http, HttpResponse } from "msw";
import type { Post, ShortPost } from "@/lib/types/post";
import type { Pagination } from "@/lib/types/api";

export const mockPosts: Post[] = [
  {
    id: "1",
    slug: "test-post-1",
    subSlug: null,
    title: "테스트 포스트 1",
    content: "테스트 내용입니다.",
    excerpt: "테스트 발췌문",
    thumbnail: null,
    tags: ["test", "vitest"],
    type: "LONG",
    published: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    series: null,
    totalViews: 10,
  },
  {
    id: "2",
    slug: "test-post-2",
    subSlug: null,
    title: "테스트 포스트 2",
    content: "두 번째 테스트 내용입니다.",
    excerpt: "두 번째 발췌문",
    thumbnail: null,
    tags: ["test"],
    type: "LONG",
    published: true,
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02"),
    series: null,
    totalViews: 5,
  },
];

export const mockShortPosts: ShortPost[] = [
  {
    id: "3",
    slug: "short-post-1",
    title: "짧은 글 1",
    content: "짧은 내용입니다.",
    excerpt: "짧은 발췌문",
    tags: ["short"],
    createdAt: new Date("2024-01-01"),
  },
];

export const mockPagination: Pagination = {
  page: 1,
  limit: 20,
  total: 2,
  totalPages: 1,
};

export const handlers = [
  http.get("/api/posts", ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    if (type === "SHORT") {
      return HttpResponse.json({
        posts: mockShortPosts,
        pagination: { ...mockPagination, total: mockShortPosts.length },
      });
    }

    return HttpResponse.json({
      posts: mockPosts,
      pagination: mockPagination,
    });
  }),

  http.get("/api/posts/:id", ({ params }) => {
    const post = mockPosts.find((p) => p.id === params.id || p.slug === params.id);
    if (!post) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(post);
  }),

  http.delete("/api/posts/:id", ({ params }) => {
    const postIndex = mockPosts.findIndex((p) => p.id === params.id);
    if (postIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({ message: "Post deleted" });
  }),

  http.get("/api/tags", () => {
    const tagCounts = mockPosts
      .flatMap((post) => post.tags || [])
      .reduce(
        (acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    return HttpResponse.json(
      Object.entries(tagCounts).map(([name, count]) => ({ name, count }))
    );
  }),
];
