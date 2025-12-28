"use client";

/**
 * 글쓰기 미리보기 컴포넌트 (현재 미사용)
 *
 * TipTap WYSIWYG 에디터 도입으로 실시간 미리보기가 불필요해져 분리됨.
 * 추후 재사용 가능성을 위해 보관.
 *
 * 사용법:
 * 1. WritePreviewDesktop - 데스크톱 사이드 패널 미리보기
 * 2. WritePreviewMobile - 모바일 전체화면 모달 미리보기
 * 3. WritePreviewFAB - 모바일용 플로팅 액션 버튼
 */

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/post";
import { FloatingActionButton } from "@/components/layout";
import { X } from "lucide-react";

interface WritePreviewDesktopProps {
  title: string;
  content: string;
}

export function WritePreviewDesktop({ title, content }: WritePreviewDesktopProps) {
  return (
    <div className="hidden lg:block bg-muted/20 overflow-y-auto">
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-8">{title || "제목 없음"}</h1>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {content ? (
            <MarkdownRenderer content={content} />
          ) : (
            <p className="text-muted-foreground italic">여기에 미리보기가 표시됩니다...</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface WritePreviewMobileProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export function WritePreviewMobile({ isOpen, onClose, title, content }: WritePreviewMobileProps) {
  const previewContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background">
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <h2 className="text-lg font-semibold">미리보기</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
            닫기
          </Button>
        </div>
      </div>

      <div ref={previewContentRef} className="overflow-y-auto h-[calc(100vh-3.5rem)]">
        <div className="container mx-auto p-4 sm:p-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8">{title || "제목 없음"}</h1>
          <div className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none">
            {content ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="text-muted-foreground italic">여기에 미리보기가 표시됩니다...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface WritePreviewFABProps {
  isPreviewOpen: boolean;
  onOpenPreview: () => void;
  onClosePreview: () => void;
  onImageUpload: () => void;
  disabled?: boolean;
}

export function WritePreviewFAB({
  isPreviewOpen,
  onOpenPreview,
  onClosePreview,
  onImageUpload,
  disabled,
}: WritePreviewFABProps) {
  return (
    <div className="lg:hidden">
      <FloatingActionButton
        onPreview={onOpenPreview}
        onClosePreview={onClosePreview}
        isPreviewActive={isPreviewOpen}
        onImageUpload={onImageUpload}
        disabled={disabled}
      />
    </div>
  );
}
