import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { usePosts, useHomePosts, usePopularPosts } from "@/hooks/usePosts";
import { server } from "../mocks/server";
import { mockPosts, mockPagination } from "../mocks/handlers";
import { render, createTestQueryClient } from "../test-utils";
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

describe("usePosts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("초기 로딩 상태를 반환한다", () => {
    const { result } = renderHook(() => usePosts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("포스트 목록을 성공적으로 가져온다", async () => {
    const { result } = renderHook(() => usePosts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.posts).toHaveLength(mockPosts.length);
    expect(result.current.data?.posts[0].title).toBe("테스트 포스트 1");
    expect(result.current.data?.pagination).toEqual(mockPagination);
  });

  it("페이지네이션 파라미터를 전달한다", async () => {
    const { result } = renderHook(() => usePosts({ page: 2, limit: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.posts).toBeDefined();
  });

  it("sortBy 파라미터를 전달한다", async () => {
    let capturedUrl = "";
    server.use(
      http.get("/api/posts", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          posts: mockPosts,
          pagination: mockPagination,
        });
      })
    );

    const { result } = renderHook(() => usePosts({ sortBy: "popular" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedUrl).toContain("sortBy=popular");
  });

  it("enabled가 false이면 쿼리를 실행하지 않는다", () => {
    const { result } = renderHook(() => usePosts({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("initialData가 있으면 초기값으로 사용한다", () => {
    const initialData = {
      posts: mockPosts,
      pagination: mockPagination,
    };

    const { result } = renderHook(() => usePosts({ initialData }), {
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

    const { result } = renderHook(() => usePosts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe("useHomePosts", () => {
  it("홈 포스트를 성공적으로 가져온다", async () => {
    const { result } = renderHook(() => useHomePosts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(mockPosts.length);
    expect(result.current.data?.[0].title).toBe("테스트 포스트 1");
  });

  it("initialData가 있으면 초기값으로 사용한다", () => {
    const { result } = renderHook(
      () => useHomePosts({ initialData: mockPosts }),
      {
        wrapper: createWrapper(),
      }
    );

    expect(result.current.data).toEqual(mockPosts);
  });
});

describe("usePopularPosts", () => {
  it("인기 포스트를 성공적으로 가져온다", async () => {
    const { result } = renderHook(() => usePopularPosts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });

  it("enabled가 false이면 쿼리를 실행하지 않는다", () => {
    const { result } = renderHook(() => usePopularPosts(false), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
