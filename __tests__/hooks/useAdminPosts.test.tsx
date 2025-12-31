import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useAdminPosts } from "@/hooks/useAdminPosts";
import { server } from "../mocks/server";
import { mockPosts, mockUnpublishedPosts } from "../mocks/handlers";
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

describe("useAdminPosts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("초기 로딩 상태를 반환한다", () => {
    const { result } = renderHook(() => useAdminPosts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("Admin 포스트 목록을 성공적으로 가져온다 (unpublished 포함)", async () => {
    const { result } = renderHook(() => useAdminPosts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const allPosts = [...mockPosts, ...mockUnpublishedPosts];
    expect(result.current.data?.posts).toHaveLength(allPosts.length);
  });

  it("tag 필터를 적용한다", async () => {
    let capturedUrl = "";
    server.use(
      http.get("/api/posts", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          posts: mockPosts.filter((p) => p.tags?.includes("test")),
        });
      })
    );

    const { result } = renderHook(
      () => useAdminPosts({ filters: { tag: "test" } }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedUrl).toContain("tag=test");
    expect(capturedUrl).toContain("includeUnpublished=true");
  });

  it("type 필터를 적용한다", async () => {
    let capturedUrl = "";
    server.use(
      http.get("/api/posts", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          posts: mockPosts.filter((p) => p.type === "SHORT"),
        });
      })
    );

    const { result } = renderHook(
      () => useAdminPosts({ filters: { type: "SHORT" } }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedUrl).toContain("type=SHORT");
  });

  it("sortBy 필터를 적용한다", async () => {
    let capturedUrl = "";
    server.use(
      http.get("/api/posts", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ posts: mockPosts });
      })
    );

    const { result } = renderHook(
      () => useAdminPosts({ filters: { sortBy: "asc" } }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedUrl).toContain("sortBy=asc");
  });

  it("날짜 필터를 적용한다", async () => {
    let capturedUrl = "";
    server.use(
      http.get("/api/posts", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ posts: mockPosts });
      })
    );

    const { result } = renderHook(
      () =>
        useAdminPosts({
          filters: { startDate: "2024-01-01", endDate: "2024-12-31" },
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedUrl).toContain("startDate=2024-01-01");
    expect(capturedUrl).toContain("endDate=2024-12-31");
  });

  it("enabled가 false이면 쿼리를 실행하지 않는다", () => {
    const { result } = renderHook(() => useAdminPosts({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
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

    const { result } = renderHook(() => useAdminPosts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it("all 값의 tag 필터는 쿼리 파라미터에 포함되지 않는다", async () => {
    let capturedUrl = "";
    server.use(
      http.get("/api/posts", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ posts: mockPosts });
      })
    );

    const { result } = renderHook(
      () => useAdminPosts({ filters: { tag: "all" } }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedUrl).not.toContain("tag=");
  });
});
