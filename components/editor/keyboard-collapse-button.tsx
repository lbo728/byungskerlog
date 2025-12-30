"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

interface KeyboardCollapseButtonProps {
  className?: string;
}

export function KeyboardCollapseButton({ className }: KeyboardCollapseButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsVisible(false);
      return;
    }

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const isEditable =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest(".tiptap-editor");

      if (isEditable) {
        setIsVisible(true);
      }
    };

    const handleBlur = () => {
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement;
        const isEditable =
          activeElement?.tagName === "INPUT" ||
          activeElement?.tagName === "TEXTAREA" ||
          activeElement?.isContentEditable ||
          activeElement?.closest(".tiptap-editor");

        if (!isEditable) {
          setIsVisible(false);
        }
      }, 100);
    };

    document.addEventListener("focusin", handleFocus);
    document.addEventListener("focusout", handleBlur);

    return () => {
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("focusout", handleBlur);
    };
  }, [isMobile]);

  const handleCollapse = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={handleCollapse}
      className={`keyboard-collapse-button fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-xl bg-white/30 dark:bg-black/30 border border-white/40 dark:border-white/20 shadow-lg transition-all duration-200 active:scale-95 ${className || ""}`}
      aria-label="키보드 접기"
    >
      <ChevronDown className="h-5 w-5 text-foreground/80" />
    </button>
  );
}
