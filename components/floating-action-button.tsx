"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Eye, ImagePlus } from "lucide-react";

interface FloatingActionButtonProps {
  onPreview: () => void;
  onImageUpload: () => void;
  disabled?: boolean;
}

export function FloatingActionButton({
  onPreview,
  onImageUpload,
  disabled = false,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="fab-container fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3"
    >
      {/* 액션 버튼들 */}
      <div
        className={`fab-actions flex flex-col-reverse items-end gap-3 transition-all duration-300 ease-out ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* 미리보기 버튼 */}
        <button
          type="button"
          onClick={() => handleAction(onPreview)}
          disabled={disabled}
          className="fab-action-item group flex items-center gap-3 transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <span className="fab-action-label px-3 py-1.5 rounded-full text-sm font-medium bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-lg text-foreground">
            미리보기
          </span>
          <span className="fab-action-icon flex items-center justify-center w-12 h-12 rounded-full bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-lg text-foreground transition-colors hover:bg-white/90 dark:hover:bg-black/70">
            <Eye className="h-5 w-5" />
          </span>
        </button>

        {/* 이미지 업로드 버튼 */}
        <button
          type="button"
          onClick={() => handleAction(onImageUpload)}
          disabled={disabled}
          className="fab-action-item group flex items-center gap-3 transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <span className="fab-action-label px-3 py-1.5 rounded-full text-sm font-medium bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-lg text-foreground">
            이미지 추가
          </span>
          <span className="fab-action-icon flex items-center justify-center w-12 h-12 rounded-full bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-lg text-foreground transition-colors hover:bg-white/90 dark:hover:bg-black/70">
            <ImagePlus className="h-5 w-5" />
          </span>
        </button>
      </div>

      {/* 메인 FAB 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`fab-main-button flex items-center justify-center w-14 h-14 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-2xl border border-white/40 dark:border-white/15 shadow-2xl text-foreground transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? "rotate-45" : "rotate-0"
        }`}
        style={{
          boxShadow: isOpen
            ? "0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
            : "0 4px 24px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
        }}
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
