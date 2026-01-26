"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;
const DEBOUNCE_MS = 1000;

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

interface UsePullToRefreshReturn {
  pullDistance: number;
  isRefreshing: boolean;
  isPulling: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function usePullToRefresh({ onRefresh, disabled = false }: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const lastRefreshTime = useRef<number>(0);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing) return;
      if (window.scrollY > 0) return;

      const touch = e.touches[0];
      touchStartY.current = touch.clientY;
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      if (disabled || isRefreshing) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartY.current;

      if (deltaY < 0) {
        touchStartY.current = null;
        setPullDistance(0);
        setIsPulling(false);
        return;
      }

      if (window.scrollY > 0) {
        touchStartY.current = null;
        setPullDistance(0);
        setIsPulling(false);
        return;
      }

      e.preventDefault();
      setIsPulling(true);

      const resistedPull = Math.min(deltaY * 0.5, MAX_PULL);
      setPullDistance(resistedPull);
    },
    [disabled, isRefreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (touchStartY.current === null) return;
    touchStartY.current = null;

    const now = Date.now();
    const canRefresh = now - lastRefreshTime.current > DEBOUNCE_MS;

    if (pullDistance >= PULL_THRESHOLD && canRefresh && !isRefreshing) {
      setIsRefreshing(true);
      lastRefreshTime.current = now;

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    setIsPulling(false);
  }, [pullDistance, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [disabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    pullDistance,
    isRefreshing,
    isPulling,
    containerRef,
  };
}
