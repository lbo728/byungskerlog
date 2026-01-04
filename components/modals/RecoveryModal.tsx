"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FileWarning } from "lucide-react";
import type { LocalDraft } from "@/lib/storage/draft-storage";

interface RecoveryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localDraft: LocalDraft;
  onRecover: () => void;
  onDiscard: () => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;

  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function RecoveryModal({
  open,
  onOpenChange,
  localDraft,
  onRecover,
  onDiscard,
}: RecoveryModalProps) {
  const title = localDraft.title || "(제목 없음)";
  const contentPreview = truncateText(localDraft.content, 100);

  const handleRecover = () => {
    onRecover();
    onOpenChange(false);
  };

  const handleDiscard = () => {
    onDiscard();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="recovery-modal sm:max-w-[425px]">
        <DialogHeader>
          <div className="recovery-modal-icon flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 mb-2">
            <FileWarning className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle>저장되지 않은 글이 있습니다</DialogTitle>
          <DialogDescription>
            이전에 작성하던 글을 복구하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        <div className="recovery-content py-4 space-y-3">
          <div className="recovery-preview rounded-lg bg-muted/50 p-3 space-y-2">
            <p className="font-medium text-sm">{title}</p>
            {contentPreview && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {contentPreview}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              마지막 저장: {formatDate(localDraft.savedAt)}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleDiscard}
          >
            새로 시작
          </Button>
          <Button
            type="button"
            onClick={handleRecover}
          >
            복구하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
