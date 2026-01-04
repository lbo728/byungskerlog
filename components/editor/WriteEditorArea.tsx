"use client";

import { RefObject } from "react";
import { EditorContent, Editor } from "@tiptap/react";

interface WriteEditorAreaProps {
  editor: Editor | null;
  isDragging: boolean;
  isUploading: boolean;
  imageInputRef: RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
}: WriteEditorAreaProps) {
  return (
    <div
      className={`content-editor relative flex-1 ${
        isDragging ? "ring-2 ring-primary ring-inset bg-primary/5" : ""
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <EditorContent
        editor={editor}
        className="tiptap-editor h-full overflow-y-auto"
      />
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 pointer-events-none z-10">
          <div className="text-primary font-medium text-lg">
            이미지를 여기에 놓으세요
          </div>
        </div>
      )}
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-muted-foreground font-medium">
            이미지 업로드 중...
          </div>
        </div>
      )}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFileSelect}
        className="hidden"
      />
    </div>
  );
}
