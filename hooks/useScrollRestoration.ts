"use client";

import { useEffect, useCallback, useRef } from "react";

interface ScrollPosition {
  scrollY: number;
  page: number;
  timestamp: number;
}

const STORAGE_KEY_PREFIX = "scroll_position_";
const EXPIRY_TIME = 30 * 60 * 1000;

export function useScrollRestoration(pageKey: string, currentPage: number) {
  const isRestoringRef = useRef(false);
  const storageKey = `${STORAGE_KEY_PREFIX}${pageKey}`;

  const saveScrollPosition = useCallback(() => {
    if (isRestoringRef.current) return;

    const position: ScrollPosition = {
      scrollY: window.scrollY,
      page: currentPage,
      timestamp: Date.now(),
    };

    try {
      sessionStorage.setItem(storageKey, JSON.stringify(position));
    } catch (e) {
      console.warn("Failed to save scroll position:", e);
    }
  }, [storageKey, currentPage]);

  const restoreScrollPosition = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (!stored) return false;

      const position: ScrollPosition = JSON.parse(stored);

      if (Date.now() - position.timestamp > EXPIRY_TIME) {
        sessionStorage.removeItem(storageKey);
        return false;
      }

      if (position.page !== currentPage) {
        return false;
      }

      isRestoringRef.current = true;

      requestAnimationFrame(() => {
        window.scrollTo(0, position.scrollY);

        sessionStorage.removeItem(storageKey);

        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
      });

      return true;
    } catch (e) {
      console.warn("Failed to restore scroll position:", e);
      return false;
    }
  }, [storageKey, currentPage]);

  const handleLinkClick = useCallback(() => {
    saveScrollPosition();
  }, [saveScrollPosition]);

  useEffect(() => {
    const timer = setTimeout(() => {
      restoreScrollPosition();
    }, 100);

    return () => clearTimeout(timer);
  }, [restoreScrollPosition]);

  useEffect(() => {
    const handlePopState = () => {
      setTimeout(() => {
        restoreScrollPosition();
      }, 50);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [restoreScrollPosition]);

  return { handleLinkClick, saveScrollPosition };
}
