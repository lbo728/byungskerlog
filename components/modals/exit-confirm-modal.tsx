"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ExitConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExitConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: ExitConfirmModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="exit-confirm-modal">
        <AlertDialogHeader>
          <AlertDialogTitle>글 작성을 중단하고 나가시겠어요?</AlertDialogTitle>
          <AlertDialogDescription>
            작성 중인 글은 임시저장 됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>계속 작성</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>나가기</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
