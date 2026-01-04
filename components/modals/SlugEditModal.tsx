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
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { useUpdatePost } from "@/hooks/usePostMutations";

interface SlugEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  currentSlug: string;
  currentSubSlug: string | null;
  onSuccess?: (slug: string, subSlug: string | null) => void;
}

const SLUG_REGEX = /^[a-z0-9가-힣-]+$/;

function validateSlug(value: string, fieldName: string): string | null {
  if (!value.trim()) {
    return `${fieldName}을(를) 입력해주세요.`;
  }

  if (!SLUG_REGEX.test(value)) {
    return "영문 소문자, 숫자, 한글, 하이픈(-)만 사용할 수 있습니다.";
  }

  if (value.startsWith("-") || value.endsWith("-")) {
    return "하이픈으로 시작하거나 끝날 수 없습니다.";
  }

  if (value.includes("--")) {
    return "연속된 하이픈은 사용할 수 없습니다.";
  }

  return null;
}

function validateSubSlug(value: string): string | null {
  if (!value.trim()) {
    return null;
  }

  const subSlugRegex = /^[a-z0-9-]+$/;
  if (!subSlugRegex.test(value)) {
    return "영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.";
  }

  if (value.startsWith("-") || value.endsWith("-")) {
    return "하이픈으로 시작하거나 끝날 수 없습니다.";
  }

  if (value.includes("--")) {
    return "연속된 하이픈은 사용할 수 없습니다.";
  }

  return null;
}

export function SlugEditModal({
  open,
  onOpenChange,
  postId,
  currentSlug,
  currentSubSlug,
  onSuccess,
}: SlugEditModalProps) {
  const [slug, setSlug] = useState(currentSlug);
  const [subSlug, setSubSlug] = useState(currentSubSlug || "");
  const [showSubSlugInput, setShowSubSlugInput] = useState(!!currentSubSlug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [subSlugError, setSubSlugError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const updatePostMutation = useUpdatePost({ showToast: false });

  if (open && !isInitialized) {
    setSlug(currentSlug);
    setSubSlug(currentSubSlug || "");
    setShowSubSlugInput(!!currentSubSlug);
    setSlugError(null);
    setSubSlugError(null);
    setIsInitialized(true);
  }

  if (!open && isInitialized) {
    setIsInitialized(false);
  }

  const handleSlugChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/\s+/g, "-");
    setSlug(normalized);
    setSlugError(validateSlug(normalized, "Main Slug"));
  };

  const handleSubSlugChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/\s+/g, "-");
    setSubSlug(normalized);
    setSubSlugError(validateSubSlug(normalized));
  };

  const handleSubmit = useCallback(async () => {
    const trimmedSlug = slug.trim();
    const trimmedSubSlug = subSlug.trim();

    const slugValidationError = validateSlug(trimmedSlug, "Main Slug");
    if (slugValidationError) {
      setSlugError(slugValidationError);
      return;
    }

    if (trimmedSubSlug) {
      const subSlugValidationError = validateSubSlug(trimmedSubSlug);
      if (subSlugValidationError) {
        setSubSlugError(subSlugValidationError);
        return;
      }
    }

    try {
      await updatePostMutation.mutateAsync({
        id: postId,
        data: {
          slug: trimmedSlug,
          subSlug: trimmedSubSlug || null,
        },
      });

      toast.success("Slug가 변경되었습니다.");
      onSuccess?.(trimmedSlug, trimmedSubSlug || null);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Slug 변경에 실패했습니다.");
    }
  }, [slug, subSlug, postId, updatePostMutation, onSuccess, onOpenChange]);

  const hasChanges = slug !== currentSlug || subSlug !== (currentSubSlug || "");
  const hasErrors = !!slugError || !!subSlugError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="slug-edit-modal sm:max-w-[500px]">
        <DialogHeader>
          <div className="slug-edit-modal-icon flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 mb-2">
            <Pencil className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <DialogTitle>Slug 수정</DialogTitle>
          <DialogDescription>
            포스트의 URL 경로를 수정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="slug-edit-form space-y-4 py-4">
          <div className="main-slug-section space-y-2">
            <Label htmlFor="main-slug" className="text-sm font-medium">
              Main Slug
            </Label>
            <div className="slug-preview text-xs text-muted-foreground mb-1">
              /posts/<span className="text-foreground font-medium">{slug || "your-slug"}</span>
            </div>
            <Input
              id="main-slug"
              placeholder="main-slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              disabled={updatePostMutation.isPending}
              className="font-mono"
            />
            {slugError && (
              <p className="text-sm text-destructive">{slugError}</p>
            )}
          </div>

          {showSubSlugInput ? (
            <div className="sub-slug-section space-y-2">
              <Label htmlFor="sub-slug" className="text-sm font-medium">
                Sub Slug <span className="text-muted-foreground font-normal">(선택)</span>
              </Label>
              <div className="slug-preview text-xs text-muted-foreground mb-1">
                /posts/<span className="text-foreground font-medium">{subSlug || "sub-slug"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="sub-slug"
                  placeholder="sub-slug (영문, 숫자, 하이픈만)"
                  value={subSlug}
                  onChange={(e) => handleSubSlugChange(e.target.value)}
                  disabled={updatePostMutation.isPending}
                  className="font-mono flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive h-9 px-3"
                  onClick={() => {
                    setShowSubSlugInput(false);
                    setSubSlug("");
                    setSubSlugError(null);
                  }}
                  disabled={updatePostMutation.isPending}
                >
                  삭제
                </Button>
              </div>
              {subSlugError && (
                <p className="text-sm text-destructive">{subSlugError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                검색 최적화를 위한 보조 URL입니다. 영문 소문자, 숫자, 하이픈만 사용 가능합니다.
              </p>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowSubSlugInput(true)}
              disabled={updatePostMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Sub Slug 추가
            </Button>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updatePostMutation.isPending}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={updatePostMutation.isPending || hasErrors || !hasChanges}
          >
            {updatePostMutation.isPending ? "저장 중..." : "확인"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
