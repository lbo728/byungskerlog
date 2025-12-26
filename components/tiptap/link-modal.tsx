"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Link as LinkIcon, Trash2 } from "lucide-react";

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
  onRemove?: () => void;
  initialUrl?: string;
  selectedText?: string;
}

export function LinkModal({
  isOpen,
  onClose,
  onSubmit,
  onRemove,
  initialUrl = "",
  selectedText = "",
}: LinkModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      let finalUrl = url.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }
      onSubmit(finalUrl);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="link-modal-overlay fixed inset-0 z-[200] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="link-modal-content bg-background border border-border rounded-lg shadow-xl w-[400px] max-w-[90vw] p-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="link-modal-header flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">링크 삽입</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {selectedText && (
          <div className="link-modal-selected mb-3 px-3 py-2 bg-muted/50 rounded text-sm">
            <span className="text-muted-foreground">선택된 텍스트: </span>
            <span className="font-medium">{selectedText.length > 30 ? selectedText.slice(0, 30) + "..." : selectedText}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            ref={inputRef}
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mb-4"
          />

          <div className="link-modal-actions flex items-center justify-between">
            {onRemove && initialUrl ? (
              <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { onRemove(); onClose(); }}>
                <Trash2 className="h-4 w-4 mr-1" />
                링크 삭제
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                취소
              </Button>
              <Button type="submit" size="sm" disabled={!url.trim()}>
                확인
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
