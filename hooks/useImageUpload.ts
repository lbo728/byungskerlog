"use client";

import { useState, useCallback, RefObject } from "react";
import { toast } from "sonner";
import { optimizeImage } from "@/lib/image-optimizer";
import type { Editor } from "@tiptap/react";

interface UseImageUploadOptions {
  editor: Editor | null;
  imageInputRef: RefObject<HTMLInputElement | null>;
}

interface UseImageUploadReturn {
  isDragging: boolean;
  isUploading: boolean;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => Promise<void>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function useImageUpload({
  editor,
  imageInputRef,
}: UseImageUploadOptions): UseImageUploadReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      toast.warning("이미지 파일만 업로드 가능합니다.");
      return null;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.warning("파일 크기는 10MB 이하여야 합니다.");
      return null;
    }

    setIsUploading(true);

    try {
      let optimizedFile = file;
      const targetSize = 500 * 1024;

      if (file.size > targetSize) {
        toast.info("이미지 최적화 중...");
        optimizedFile = await optimizeImage(file, targetSize);
      }

      const filename = `${Date.now()}-${optimizedFile.name}`;
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(filename)}`,
        {
          method: "POST",
          body: optimizedFile,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const blob = await response.json();
      return blob.url;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("이미지 업로드에 실패했습니다.");
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const insertImageMarkdown = useCallback(
    (url: string, altText: string = "image") => {
      if (!editor) return;

      const imageMarkdown = `![${altText}](${url})\n`;
      editor.commands.insertContent(imageMarkdown);
      editor.commands.focus();
    },
    [editor]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      for (const file of imageFiles) {
        const url = await uploadImage(file);
        if (url) {
          insertImageMarkdown(url, file.name.replace(/\.[^/.]+$/, ""));
        }
      }
    },
    [uploadImage, insertImageMarkdown]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      for (const file of Array.from(files)) {
        if (file.type.startsWith("image/")) {
          const url = await uploadImage(file);
          if (url) {
            insertImageMarkdown(url, file.name.replace(/\.[^/.]+$/, ""));
          }
        }
      }

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    },
    [uploadImage, insertImageMarkdown, imageInputRef]
  );

  return {
    isDragging,
    isUploading,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
  };
}
