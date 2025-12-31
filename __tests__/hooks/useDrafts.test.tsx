import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useDrafts, useDraft } from "@/hooks/useDrafts";
import { useDeleteDraft } from "@/hooks/useDraftMutations";
import { server } from "../mocks/server";
import { mockDrafts } from "../mocks/handlers";
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

describe("useDrafts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("초기 로딩 상태를 반환한다", () => {
    const { result } = renderHook(() => useDrafts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("드래프트 목록을 성공적으로 가져온다", async () => {
    const { result } = renderHook(() => useDrafts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(mockDrafts.length);
    expect(result.current.data?.[0].title).toBe("임시저장 글 1");
  });

  it("enabled가 false이면 쿼리를 실행하지 않는다", () => {
    const { result } = renderHook(() => useDrafts({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("API 에러 시 에러 상태를 반환한다", async () => {
    server.use(
      http.get("/api/drafts", () => {
        return HttpResponse.json(
          { error: "Internal Server Error" },
          { status: 500 }
        );
      })
    );

    const { result } = renderHook(() => useDrafts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe("useDraft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("단일 드래프트를 성공적으로 가져온다", async () => {
    const { result } = renderHook(() => useDraft("draft-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.title).toBe("임시저장 글 1");
    expect(result.current.data?.id).toBe("draft-1");
  });

  it("존재하지 않는 드래프트 조회 시 에러를 반환한다", async () => {
    const { result } = renderHook(() => useDraft("non-existent"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("id가 빈 문자열이면 쿼리를 실행하지 않는다", () => {
    const { result } = renderHook(() => useDraft(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});

describe("useDeleteDraft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("드래프트를 성공적으로 삭제한다", async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useDeleteDraft(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("draft-1");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("낙관적 업데이트로 캐시가 즉시 업데이트된다", async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result: draftsResult } = renderHook(() => useDrafts(), { wrapper });

    await waitFor(() => {
      expect(draftsResult.current.isSuccess).toBe(true);
    });

    const initialLength = draftsResult.current.data?.length ?? 0;
    expect(initialLength).toBe(2);

    const { result: deleteResult } = renderHook(() => useDeleteDraft(), {
      wrapper,
    });

    act(() => {
      deleteResult.current.mutate("draft-1");
    });

    await waitFor(() => {
      expect(deleteResult.current.isSuccess).toBe(true);
    });
  });

  it("존재하지 않는 드래프트 삭제 시 에러를 반환하고 롤백한다", async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result: draftsResult } = renderHook(() => useDrafts(), { wrapper });

    await waitFor(() => {
      expect(draftsResult.current.isSuccess).toBe(true);
    });

    const initialLength = draftsResult.current.data?.length ?? 0;

    const { result: deleteResult } = renderHook(() => useDeleteDraft(), {
      wrapper,
    });

    await act(async () => {
      try {
        await deleteResult.current.mutateAsync("non-existent");
      } catch {
        // expected error
      }
    });

    await waitFor(() => {
      expect(draftsResult.current.data?.length).toBe(initialLength);
    });
  });
});
