"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { Check } from "lucide-react";

interface SubSlugModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  currentSubSlug: string | null;
  onSuccess: (newSubSlug: string) => void;
}

const SUB_SLUG_REGEX = /^[a-z0-9-]+$/;

export function SubSlugModal({
  open,
  onOpenChange,
  postId,
  currentSubSlug,
  onSuccess,
}: SubSlugModalProps) {
  const [subSlug, setSubSlug] = useState(currentSubSlug || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateSubSlug = (value: string): string | null => {
    if (!value.trim()) {
      return null;
    }

    if (!SUB_SLUG_REGEX.test(value)) {
      return "영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.";
    }

    if (value.startsWith("-") || value.endsWith("-")) {
      return "하이픈으로 시작하거나 끝날 수 없습니다.";
    }

    if (value.includes("--")) {
      return "연속된 하이픈은 사용할 수 없습니다.";
    }

    return null;
  };

  const handleSubSlugChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/\s+/g, "-");
    setSubSlug(normalized);
    setError(validateSubSlug(normalized));
  };

  const handleSubmit = useCallback(async () => {
    const trimmedSlug = subSlug.trim();

    if (!trimmedSlug) {
      onOpenChange(false);
      return;
    }

    const validationError = validateSubSlug(trimmedSlug);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}/sub-slug`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subSlug: trimmedSlug }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "저장에 실패했습니다.");
      }

      const siteUrl = window.location.origin;
      const newUrl = `${siteUrl}/posts/${trimmedSlug}`;

      await navigator.clipboard.writeText(newUrl);
      toast.success("짧은 URL이 저장되고 클립보드에 복사되었습니다!");

      onSuccess(trimmedSlug);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }, [subSlug, postId, onSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sub-slug-modal sm:max-w-[425px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="sub-slug-modal-icon flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 mb-2">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle>링크 복사가 완료되었습니다</DialogTitle>
          <DialogDescription>
            혹시 URL을 간략하게 조정하고 싶으신가요?
          </DialogDescription>
        </DialogHeader>

        <div className="sub-slug-input-section py-4">
          <div className="sub-slug-preview text-sm text-muted-foreground mb-2">
            {window.location.origin}/posts/
            <span className="text-foreground font-medium">
              {subSlug || "your-short-url"}
            </span>
          </div>
          <Input
            placeholder="영문 소문자, 숫자, 하이픈만 사용"
            value={subSlug}
            onChange={(e) => handleSubSlugChange(e.target.value)}
            disabled={isSubmitting}
            className="font-mono"
          />
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            입력하지 않으면 기본 URL이 유지됩니다.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !!error}
          >
            {isSubmitting ? "저장 중..." : "확인"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
