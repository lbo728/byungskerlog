"use client";

import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useStandaloneMode } from "@/hooks/useStandaloneMode";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

export function PullToRefresh({ children, onRefresh, disabled = false }: PullToRefreshProps) {
  const isStandalone = useStandaloneMode();
  const { pullDistance, isRefreshing, isPulling, containerRef } = usePullToRefresh({
    onRefresh,
    disabled: disabled || !isStandalone,
  });

  if (!isStandalone) {
    return <>{children}</>;
  }

  const indicatorOpacity = Math.min(pullDistance / 60, 1);
  const indicatorScale = Math.min(0.5 + (pullDistance / 120) * 0.5, 1);
  const showIndicator = isPulling || isRefreshing;

  return (
    <div ref={containerRef} className="ptr-container relative">
      {showIndicator && (
        <div
          className="ptr-indicator"
          style={{
            transform: `translateY(${pullDistance}px) scale(${indicatorScale})`,
            opacity: indicatorOpacity,
          }}
        >
          <div className={`ptr-spinner ${isRefreshing ? "ptr-spinner-active" : ""}`} />
        </div>
      )}
      <div
        className="ptr-content"
        style={{
          transform: isPulling ? `translateY(${pullDistance}px)` : undefined,
          transition: isPulling ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
