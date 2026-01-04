"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface UseExitConfirmOptions {
  enabled: boolean;
  onBeforeExit: () => Promise<void>;
}

interface UseExitConfirmReturn {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  handleConfirmExit: () => void;
  handleCancelExit: () => void;
  triggerExit: (href: string) => void;
}

export function useExitConfirm({
  enabled,
  onBeforeExit,
}: UseExitConfirmOptions): UseExitConfirmReturn {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pendingHrefRef = useRef<string | null>(null);
  const isExitingRef = useRef(false);

  const triggerExit = useCallback((href: string) => {
    if (!enabled) {
      router.push(href);
      return;
    }
    pendingHrefRef.current = href;
    setIsModalOpen(true);
  }, [enabled, router]);

  const handleConfirmExit = useCallback(async () => {
    isExitingRef.current = true;
    setIsModalOpen(false);

    try {
      await onBeforeExit();
    } catch (error) {
      console.error("Error saving before exit:", error);
    }

    if (pendingHrefRef.current) {
      if (pendingHrefRef.current === "back") {
        router.back();
      } else {
        router.push(pendingHrefRef.current);
      }
      pendingHrefRef.current = null;
    }
  }, [onBeforeExit, router]);

  const handleCancelExit = useCallback(() => {
    setIsModalOpen(false);
    pendingHrefRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isExitingRef.current) return;

      e.preventDefault();
      e.returnValue = "";

      onBeforeExit().catch(console.error);
    };

    const handlePopState = () => {
      if (isExitingRef.current) return;

      window.history.pushState(null, "", window.location.href);
      pendingHrefRef.current = "back";
      setIsModalOpen(true);
    };

    window.history.pushState(null, "", window.location.href);

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [enabled, onBeforeExit]);

  useEffect(() => {
    if (!enabled) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      if (href.startsWith("/admin/write")) return;

      if (href.startsWith("http") && !href.includes(window.location.host)) return;

      if (href.startsWith("/") || href.startsWith(window.location.origin)) {
        e.preventDefault();
        triggerExit(href);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [enabled, triggerExit]);

  return {
    isModalOpen,
    setIsModalOpen,
    handleConfirmExit,
    handleCancelExit,
    triggerExit,
  };
}
