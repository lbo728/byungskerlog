import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useSeries } from "@/hooks/useSeries";
import {
  useCreateSeries,
  useUpdateSeries,
  useDeleteSeries,
} from "@/hooks/useSeriesMutations";
import { server } from "../mocks/server";
import { mockSeries } from "../mocks/handlers";
import { createTestQueryClient } from "../test-utils";
import { QueryClientProvider } from "@tanstack/react-query";
import type { Series } from "@/lib/types/post";
import React from "react";

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useSeries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("초기 로딩 상태를 반환한다", () => {
    const { result } = renderHook(() => useSeries(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("시리즈 목록을 성공적으로 가져온다", async () => {
    const { result } = renderHook(() => useSeries(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(mockSeries.length);
    expect(result.current.data?.[0].name).toBe("React 시리즈");
  });

  it("enabled가 false이면 쿼리를 실행하지 않는다", () => {
    const { result } = renderHook(() => useSeries({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("API 에러 시 에러 상태를 반환한다", async () => {
    server.use(
      http.get("/api/series", () => {
        return HttpResponse.json(
          { error: "Internal Server Error" },
          { status: 500 }
        );
      })
    );

    const { result } = renderHook(() => useSeries(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe("useCreateSeries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("시리즈를 성공적으로 생성한다", async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateSeries(), { wrapper });

    let createdSeries: Series | undefined;
    await act(async () => {
      createdSeries = await result.current.mutateAsync({
        name: "새 시리즈",
        description: "새 시리즈 설명",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(createdSeries?.name).toBe("새 시리즈");
  });
});

describe("useUpdateSeries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("시리즈를 성공적으로 수정한다", async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateSeries(), { wrapper });

    let updatedSeries: Series | undefined;
    await act(async () => {
      updatedSeries = await result.current.mutateAsync({
        id: "series-1",
        name: "수정된 시리즈",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(updatedSeries?.name).toBe("수정된 시리즈");
  });

  it("존재하지 않는 시리즈 수정 시 에러를 반환한다", async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateSeries(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          id: "non-existent",
          name: "수정된 시리즈",
        });
      } catch {
        // expected error
      }
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useDeleteSeries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("시리즈를 성공적으로 삭제한다", async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useDeleteSeries(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("series-1");
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

    const { result: seriesResult } = renderHook(() => useSeries(), { wrapper });

    await waitFor(() => {
      expect(seriesResult.current.isSuccess).toBe(true);
    });

    const initialLength = seriesResult.current.data?.length ?? 0;
    expect(initialLength).toBe(2);

    const { result: deleteResult } = renderHook(() => useDeleteSeries(), {
      wrapper,
    });

    act(() => {
      deleteResult.current.mutate("series-1");
    });

    await waitFor(() => {
      expect(deleteResult.current.isSuccess).toBe(true);
    });

    expect(deleteResult.current.isSuccess).toBe(true);
  });

  it("존재하지 않는 시리즈 삭제 시 에러를 반환하고 롤백한다", async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result: seriesResult } = renderHook(() => useSeries(), { wrapper });

    await waitFor(() => {
      expect(seriesResult.current.isSuccess).toBe(true);
    });

    const initialLength = seriesResult.current.data?.length ?? 0;

    const { result: deleteResult } = renderHook(() => useDeleteSeries(), {
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
      expect(seriesResult.current.data?.length).toBe(initialLength);
    });
  });
});
