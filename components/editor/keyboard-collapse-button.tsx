"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

interface KeyboardCollapseButtonProps {
  className?: string;
}

export function KeyboardCollapseButton({ className }: KeyboardCollapseButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(16);

  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice && isSmallScreen);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isEditableElement = useCallback((element: HTMLElement | null): boolean => {
    if (!element) return false;

    const tagName = element.tagName?.toUpperCase();
    if (tagName === "INPUT" || tagName === "TEXTAREA") return true;
    if (element.isContentEditable) return true;
    if (element.closest(".tiptap-editor")) return true;
    if (element.closest(".ProseMirror")) return true;
    if (element.closest("[contenteditable='true']")) return true;

    return false;
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsVisible(false);
      return;
    }

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (isEditableElement(target)) {
        setIsVisible(true);
      }
    };

    const handleBlur = () => {
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement;
        if (!isEditableElement(activeElement)) {
          setIsVisible(false);
        }
      }, 150);
    };

    document.addEventListener("focusin", handleFocus);
    document.addEventListener("focusout", handleBlur);

    return () => {
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("focusout", handleBlur);
    };
  }, [isMobile, isEditableElement]);

  useEffect(() => {
    if (!isMobile || !isVisible) return;

    const updatePosition = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardHeight = windowHeight - viewportHeight;

        if (keyboardHeight > 100) {
          setBottomOffset(keyboardHeight + 16);
        } else {
          setBottomOffset(16);
        }
      }
    };

    updatePosition();

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updatePosition);
      window.visualViewport.addEventListener("scroll", updatePosition);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updatePosition);
        window.visualViewport.removeEventListener("scroll", updatePosition);
      }
    };
  }, [isMobile, isVisible]);

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
      style={{ bottom: `${bottomOffset}px` }}
      className={`keyboard-collapse-button fixed right-4 z-[9999] flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-xl bg-white/40 dark:bg-black/40 border border-white/50 dark:border-white/30 shadow-xl transition-all duration-200 active:scale-95 ${className || ""}`}
      aria-label="키보드 접기"
    >
      <ChevronDown className="h-6 w-6 text-foreground" />
    </button>
  );
}
