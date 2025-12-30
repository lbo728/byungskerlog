import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useClipboard } from "@/hooks/useClipboard";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useClipboard", () => {
  const mockWriteText = vi.fn();

  beforeEach(() => {
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("복사 성공", () => {
    beforeEach(() => {
      mockWriteText.mockResolvedValue(undefined);
    });

    it("should copy text to clipboard", async () => {
      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        const success = await result.current.copy("test text");
        expect(success).toBe(true);
      });

      expect(mockWriteText).toHaveBeenCalledWith("test text");
    });

    it("should show success toast with default message", async () => {
      const { toast } = await import("sonner");
      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy("test");
      });

      expect(toast.success).toHaveBeenCalledWith("클립보드에 복사되었습니다");
    });

    it("should show success toast with custom message", async () => {
      const { toast } = await import("sonner");
      const { result } = renderHook(() =>
        useClipboard({ successMessage: "Copied!" })
      );

      await act(async () => {
        await result.current.copy("test");
      });

      expect(toast.success).toHaveBeenCalledWith("Copied!");
    });

    it("should call onSuccess callback", async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useClipboard({ onSuccess }));

      await act(async () => {
        await result.current.copy("test");
      });

      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe("복사 실패", () => {
    beforeEach(() => {
      mockWriteText.mockRejectedValue(new Error("Copy failed"));
    });

    it("should return false on failure", async () => {
      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        const success = await result.current.copy("test text");
        expect(success).toBe(false);
      });
    });

    it("should show error toast with default message", async () => {
      const { toast } = await import("sonner");
      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy("test");
      });

      expect(toast.error).toHaveBeenCalledWith("복사에 실패했습니다");
    });

    it("should show error toast with custom message", async () => {
      const { toast } = await import("sonner");
      const { result } = renderHook(() =>
        useClipboard({ errorMessage: "Failed!" })
      );

      await act(async () => {
        await result.current.copy("test");
      });

      expect(toast.error).toHaveBeenCalledWith("Failed!");
    });

    it("should call onError callback", async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useClipboard({ onError }));

      await act(async () => {
        await result.current.copy("test");
      });

      expect(onError).toHaveBeenCalled();
    });
  });
});
