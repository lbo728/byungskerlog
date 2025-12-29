"use client";

import { toast } from "sonner";

interface UseClipboardOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: () => void;
}

export function useClipboard(options: UseClipboardOptions = {}) {
  const {
    successMessage = "클립보드에 복사되었습니다",
    errorMessage = "복사에 실패했습니다",
    onSuccess,
    onError,
  } = options;

  const copy = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
      onSuccess?.();
      return true;
    } catch {
      toast.error(errorMessage);
      onError?.();
      return false;
    }
  };

  return { copy };
}
