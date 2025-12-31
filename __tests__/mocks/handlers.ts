import { http, HttpResponse } from "msw";
import type { Post, ShortPost, Series, Draft } from "@/lib/types/post";
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

export const mockUnpublishedPosts: Post[] = [
  {
    id: "3",
    slug: "unpublished-post-1",
    subSlug: null,
    title: "비공개 포스트 1",
    content: "비공개 내용입니다.",
    excerpt: "비공개 발췌문",
    thumbnail: null,
    tags: ["draft"],
    type: "LONG",
    published: false,
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-03"),
    series: null,
    totalViews: 0,
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

export const mockSeries: Series[] = [
  {
    id: "series-1",
    name: "React 시리즈",
    slug: "react-series",
    description: "React 관련 글 모음",
    _count: { posts: 3 },
  },
  {
    id: "series-2",
    name: "TypeScript 시리즈",
    slug: "typescript-series",
    description: null,
    _count: { posts: 2 },
  },
];

export const mockDrafts: Draft[] = [
  {
    id: "draft-1",
    title: "임시저장 글 1",
    content: "작성 중인 내용입니다.",
    tags: ["draft", "wip"],
    authorId: "user-1",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
  },
  {
    id: "draft-2",
    title: "임시저장 글 2",
    content: "두 번째 작성 중인 내용입니다.",
    tags: ["draft"],
    authorId: "user-1",
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-04"),
  },
];

export const handlers = [
  http.get("/api/posts", ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const includeUnpublished = url.searchParams.get("includeUnpublished");

    if (type === "SHORT") {
      return HttpResponse.json({
        posts: mockShortPosts,
        pagination: { ...mockPagination, total: mockShortPosts.length },
      });
    }

    const posts =
      includeUnpublished === "true"
        ? [...mockPosts, ...mockUnpublishedPosts]
        : mockPosts;

    return HttpResponse.json({
      posts,
      pagination: { ...mockPagination, total: posts.length },
    });
  }),

  http.get<{ id: string }>("/api/posts/:id", ({ params }) => {
    const post = mockPosts.find((p) => p.id === params.id || p.slug === params.id);
    if (!post) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(post);
  }),

  http.delete<{ id: string }>("/api/posts/:id", ({ params }) => {
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

  http.get("/api/series", () => {
    return HttpResponse.json(mockSeries);
  }),

  http.post("/api/series", async ({ request }) => {
    const body = (await request.json()) as { name: string; description?: string };
    const newSeries: Series = {
      id: `series-${Date.now()}`,
      name: body.name,
      slug: body.name.toLowerCase().replace(/\s+/g, "-"),
      description: body.description || null,
      _count: { posts: 0 },
    };
    return HttpResponse.json(newSeries, { status: 201 });
  }),

  http.patch<{ id: string }>("/api/series/:id", async ({ params, request }) => {
    const body = (await request.json()) as { name?: string; description?: string };
    const series = mockSeries.find((s) => s.id === params.id);
    if (!series) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({
      ...series,
      ...body,
    });
  }),

  http.delete<{ id: string }>("/api/series/:id", ({ params }) => {
    const seriesIndex = mockSeries.findIndex((s) => s.id === params.id);
    if (seriesIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({ success: true });
  }),

  http.get("/api/drafts", () => {
    return HttpResponse.json(mockDrafts);
  }),

  http.get<{ id: string }>("/api/drafts/:id", ({ params }) => {
    const draft = mockDrafts.find((d) => d.id === params.id);
    if (!draft) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(draft);
  }),

  http.delete<{ id: string }>("/api/drafts/:id", ({ params }) => {
    const draftIndex = mockDrafts.findIndex((d) => d.id === params.id);
    if (draftIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({ success: true });
  }),
];
