"use client";

import { useEffect, useRef, useCallback } from "react";

interface ReadingTrackerProps {
  slug: string;
  postType: "LONG" | "SHORT";
}

const SESSION_KEY = "byungskerlog_reading_session";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function ReadingTracker({ slug, postType }: ReadingTrackerProps) {
  const maxScrollDepthRef = useRef(0);
  const readingTimeRef = useRef(0);
  const lastSaveTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCompletedRef = useRef(false);

  const saveReadingSession = useCallback(async () => {
    if (postType !== "LONG") return;

    const sessionId = getOrCreateSessionId();
    if (!sessionId) return;

    const now = Date.now();
    const elapsedSeconds = lastSaveTimeRef.current !== null ? Math.floor((now - lastSaveTimeRef.current) / 1000) : 0;
    lastSaveTimeRef.current = now;

    try {
      await fetch(`/api/posts-by-slug/${slug}/reading-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          maxScrollDepth: maxScrollDepthRef.current,
          readingTime: elapsedSeconds,
          completed: isCompletedRef.current,
        }),
      });
    } catch (error) {
      console.error("Failed to save reading session:", error);
    }
  }, [slug, postType]);

  useEffect(() => {
    if (postType !== "LONG") return;

    // Initialize lastSaveTimeRef in effect to avoid impure function call during render
    lastSaveTimeRef.current = Date.now();

    const calculateScrollDepth = () => {
      const article = document.querySelector("article");
      if (!article) return 0;

      const scrollTop = window.scrollY;
      const articleRect = article.getBoundingClientRect();
      const articleBottom = scrollTop + articleRect.bottom;
      const readableHeight = articleBottom - window.innerHeight;

      if (readableHeight <= 0) return 100;

      const scrollPercent = (scrollTop / readableHeight) * 100;
      return Math.min(100, Math.max(0, scrollPercent));
    };

    const handleScroll = () => {
      const currentDepth = calculateScrollDepth();
      if (currentDepth > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = currentDepth;
      }
      if (currentDepth >= 95 && !isCompletedRef.current) {
        isCompletedRef.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    intervalRef.current = setInterval(() => {
      readingTimeRef.current += 30;
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveReadingSession();
      }
    };

    const handleBeforeUnload = () => {
      const sessionId = getOrCreateSessionId();
      if (!sessionId) return;

      const now = Date.now();
      const elapsedSeconds = lastSaveTimeRef.current !== null ? Math.floor((now - lastSaveTimeRef.current) / 1000) : 0;

      navigator.sendBeacon(
        `/api/posts-by-slug/${slug}/reading-session`,
        JSON.stringify({
          sessionId,
          maxScrollDepth: maxScrollDepthRef.current,
          readingTime: elapsedSeconds,
          completed: isCompletedRef.current,
        })
      );
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      saveReadingSession();
    };
  }, [slug, postType, saveReadingSession]);

  return null;
}
