import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useDeletePost } from "@/hooks/useDeletePost";
import { server } from "../mocks/server";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from "sonner";

describe("useDeletePost", () => {
  let originalConfirm: typeof window.confirm;

  beforeEach(() => {
    vi.clearAllMocks();
    originalConfirm = window.confirm;
  });

  afterEach(() => {
    window.confirm = originalConfirm;
  });

  it("confirm을 취소하면 삭제하지 않는다", async () => {
    window.confirm = vi.fn(() => false);

    const { result } = renderHook(() => useDeletePost());

    let deleteResult: boolean | undefined;
    await act(async () => {
      deleteResult = await result.current.deletePost("1", "테스트 포스트");
    });

    expect(deleteResult).toBe(false);
    expect(window.confirm).toHaveBeenCalledWith(
      '"테스트 포스트" 포스트를 삭제하시겠습니까?'
    );
  });

  it("confirm을 승인하면 삭제 API를 호출한다", async () => {
    window.confirm = vi.fn(() => true);

    const { result } = renderHook(() => useDeletePost());

    let deleteResult: boolean | undefined;
    await act(async () => {
      deleteResult = await result.current.deletePost("1", "테스트 포스트");
    });

    expect(deleteResult).toBe(true);
    expect(toast.success).toHaveBeenCalledWith("포스트가 삭제되었습니다.");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("삭제 성공 후 onSuccess 콜백을 호출한다", async () => {
    window.confirm = vi.fn(() => true);
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useDeletePost({ onSuccess }));

    await act(async () => {
      await result.current.deletePost("1", "테스트 포스트");
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it("redirectTo가 있으면 삭제 후 리다이렉트한다", async () => {
    window.confirm = vi.fn(() => true);

    const { result } = renderHook(() =>
      useDeletePost({ redirectTo: "/admin/posts" })
    );

    await act(async () => {
      await result.current.deletePost("1", "테스트 포스트");
    });

    expect(mockPush).toHaveBeenCalledWith("/admin/posts");
  });

  it("삭제 실패 시 에러 토스트를 표시한다", async () => {
    window.confirm = vi.fn(() => true);

    server.use(
      http.delete("/api/posts/:id", () => {
        return HttpResponse.json(
          { error: "Not Found", code: "NOT_FOUND" },
          { status: 404 }
        );
      })
    );

    const { result } = renderHook(() => useDeletePost());

    let deleteResult: boolean | undefined;
    await act(async () => {
      deleteResult = await result.current.deletePost("999", "없는 포스트");
    });

    expect(deleteResult).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      "포스트 삭제 중 오류가 발생했습니다."
    );
  });

  it("네트워크 에러 시 에러 토스트를 표시한다", async () => {
    window.confirm = vi.fn(() => true);

    server.use(
      http.delete("/api/posts/:id", () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() => useDeletePost());

    let deleteResult: boolean | undefined;
    await act(async () => {
      deleteResult = await result.current.deletePost("1", "테스트 포스트");
    });

    expect(deleteResult).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it("onSuccess 콜백 없이도 정상 동작한다", async () => {
    window.confirm = vi.fn(() => true);

    const { result } = renderHook(() => useDeletePost());

    let deleteResult: boolean | undefined;
    await act(async () => {
      deleteResult = await result.current.deletePost("1", "테스트 포스트");
    });

    expect(deleteResult).toBe(true);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("redirectTo 없이도 정상 동작한다", async () => {
    window.confirm = vi.fn(() => true);

    const { result } = renderHook(() => useDeletePost());

    await act(async () => {
      await result.current.deletePost("1", "테스트 포스트");
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });
});
