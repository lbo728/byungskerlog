import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { usePost } from "@/hooks/usePost";
import { server } from "../mocks/server";
import { mockPosts } from "../mocks/handlers";
import { createTestQueryClient } from "../test-utils";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { queryKeys } from "@/lib/queryKeys";

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("usePost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("초기 로딩 상태를 반환한다", () => {
    const { result } = renderHook(() => usePost("1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("단일 포스트를 성공적으로 가져온다", async () => {
    const { result } = renderHook(() => usePost("1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.title).toBe("테스트 포스트 1");
    expect(result.current.data?.id).toBe("1");
  });

  it("존재하지 않는 포스트 조회 시 에러를 반환한다", async () => {
    const { result } = renderHook(() => usePost("non-existent"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("id가 빈 문자열이면 쿼리를 실행하지 않는다", () => {
    const { result } = renderHook(() => usePost(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("enabled가 false이면 쿼리를 실행하지 않는다", () => {
    const { result } = renderHook(() => usePost("1", { enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("캐시에 데이터가 있으면 즉시 사용한다", async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    queryClient.setQueryData(queryKeys.posts.detailById("1"), mockPosts[0]);

    const { result } = renderHook(() => usePost("1"), { wrapper });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data?.title).toBe("테스트 포스트 1");
  });

  it("staleTime이 Infinity로 설정되어 있다", async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePost("1"), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const state = queryClient.getQueryState(queryKeys.posts.detailById("1"));
    expect(state?.isInvalidated).toBe(false);
  });

  it("slug로도 포스트를 조회할 수 있다", async () => {
    const { result } = renderHook(() => usePost("test-post-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.title).toBe("테스트 포스트 1");
  });
});
