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
} from "@/components/ui/AlertDialog";

interface ExitConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isEditMode?: boolean;
}

export function ExitConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isEditMode = false,
}: ExitConfirmModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="exit-confirm-modal">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isEditMode
              ? "수정을 취소하고 나가시겠어요?"
              : "글 작성을 중단하고 나가시겠어요?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isEditMode
              ? "변경된 내용은 저장되지 않습니다."
              : "작성 중인 글은 임시저장 됩니다."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {isEditMode ? "계속 수정" : "계속 작성"}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>나가기</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
