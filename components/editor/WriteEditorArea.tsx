"use client";

import { RefObject } from "react";
import { EditorContent, Editor } from "@tiptap/react";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";

interface WriteEditorAreaProps {
  editor: Editor | null;
  isDragging: boolean;
  isUploading: boolean;
  imageInputRef: RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearContent?: () => void;
  hasContent?: boolean;
}

export function WriteEditorArea({
  editor,
  isDragging,
  isUploading,
  imageInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onClearContent,
  hasContent = false,
}: WriteEditorAreaProps) {
  return (
    <div
      className={`content-editor relative flex-1 ${isDragging ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {onClearContent && hasContent && (
        <div className="clear-content-button absolute top-2 right-2 z-10">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={onClearContent}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            내용 모두 지우기
          </Button>
        </div>
      )}
      <EditorContent editor={editor} className="tiptap-editor h-full overflow-y-auto" />
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 pointer-events-none z-10">
          <div className="text-primary font-medium text-lg">이미지를 여기에 놓으세요</div>
        </div>
      )}
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-muted-foreground font-medium">이미지 업로드 중...</div>
        </div>
      )}
      <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={onFileSelect} className="hidden" />
    </div>
  );
}
