"use client";

import { useState, useCallback } from "react";
import { ImageIcon, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ThumbnailUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

const MAX_SIZE = 500 * 1024;

export function ThumbnailUploader({ value, onChange, disabled }: ThumbnailUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);

      if (!file.type.startsWith("image/")) {
        setError("이미지 파일만 업로드 가능합니다.");
        return;
      }

      if (file.size > MAX_SIZE) {
        setError("파일 크기는 500KB 이하여야 합니다.");
        return;
      }

      setIsUploading(true);

      try {
        const response = await fetch(`/api/upload/thumbnail?filename=${encodeURIComponent(file.name)}`, {
          method: "POST",
          body: file,
          headers: {
            "Content-Length": file.size.toString(),
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "업로드에 실패했습니다.");
        }

        const blob = await response.json();
        onChange(blob.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "업로드에 실패했습니다.");
      } finally {
        setIsUploading(false);
      }
    },
    [onChange]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemove = useCallback(() => {
    onChange(null);
    setError(null);
  }, [onChange]);

  return (
    <div className="thumbnail-uploader space-y-2">
      <label className="text-sm font-medium">썸네일 이미지</label>

      {value ? (
        <div className="thumbnail-preview relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
          <Image src={value} alt="썸네일 미리보기" fill className="object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label
          className={`thumbnail-dropzone flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-8 w-8 animate-pulse" />
              <span className="text-sm">업로드 중...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
              <span className="text-sm">이미지를 드래그하거나 클릭하여 업로드</span>
              <span className="text-xs">500KB 이하</span>
            </div>
          )}
        </label>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
