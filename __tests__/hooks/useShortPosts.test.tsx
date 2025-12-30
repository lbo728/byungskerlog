import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useShortPosts } from "@/hooks/useShortPosts";
import { server } from "../mocks/server";
import { mockShortPosts, mockPagination } from "../mocks/handlers";
import { createTestQueryClient } from "../test-utils";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useShortPosts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("초기 로딩 상태를 반환한다", () => {
    const { result } = renderHook(() => useShortPosts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("짧은 글 목록을 성공적으로 가져온다", async () => {
    const { result } = renderHook(() => useShortPosts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.posts).toHaveLength(mockShortPosts.length);
    expect(result.current.data?.posts[0].title).toBe("짧은 글 1");
  });

  it("type=SHORT 파라미터를 전달한다", async () => {
    let capturedUrl = "";
    server.use(
      http.get("/api/posts", ({ request }) => {
        capturedUrl = request.url;
        const url = new URL(request.url);
        const type = url.searchParams.get("type");

        if (type === "SHORT") {
          return HttpResponse.json({
            posts: mockShortPosts,
            pagination: { ...mockPagination, total: mockShortPosts.length },
          });
        }

        return HttpResponse.json({
          posts: [],
          pagination: mockPagination,
        });
      })
    );

    const { result } = renderHook(() => useShortPosts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedUrl).toContain("type=SHORT");
  });

  it("페이지네이션 파라미터를 전달한다", async () => {
    let capturedUrl = "";
    server.use(
      http.get("/api/posts", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          posts: mockShortPosts,
          pagination: { ...mockPagination, page: 2 },
        });
      })
    );

    const { result } = renderHook(() => useShortPosts({ page: 2, limit: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedUrl).toContain("page=2");
    expect(capturedUrl).toContain("limit=10");
  });

  it("initialData가 있으면 초기값으로 사용한다", () => {
    const initialData = {
      posts: mockShortPosts,
      pagination: { ...mockPagination, total: mockShortPosts.length },
    };

    const { result } = renderHook(() => useShortPosts({ initialData }), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toEqual(initialData);
  });

  it("API 에러 시 에러 상태를 반환한다", async () => {
    server.use(
      http.get("/api/posts", () => {
        return HttpResponse.json(
          { error: "Internal Server Error", code: "INTERNAL_ERROR" },
          { status: 500 }
        );
      })
    );

    const { result } = renderHook(() => useShortPosts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it("staleTime이 5분으로 설정되어 있다", async () => {
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useShortPosts(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isStale).toBe(false);
  });
});
