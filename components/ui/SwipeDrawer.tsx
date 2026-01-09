"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

const DRAWER_WIDTH = 300;
const EDGE_WIDTH = 30;
const VELOCITY_THRESHOLD = 500;
const POSITION_THRESHOLD = 0.5;

const springConfig = {
  stiffness: 400,
  damping: 40,
  mass: 1,
};

interface SwipeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDraggingChange?: (isDragging: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function SwipeDrawer({ open, onOpenChange, onDraggingChange, children, className }: SwipeDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDraggingState] = useState(false);

  const setIsDragging = (value: boolean) => {
    setIsDraggingState(value);
    onDraggingChange?.(value);
  };
  const drawerX = useSpring(DRAWER_WIDTH, springConfig);
  const overlayOpacity = useTransform(drawerX, [0, DRAWER_WIDTH], [0.5, 0]);

  const touchStartRef = useRef<{ x: number; y: number; isEdge: boolean } | null>(null);
  const lastVelocityRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      drawerX.set(0);
    } else if (!isDragging) {
      drawerX.set(DRAWER_WIDTH);
    }
  }, [open, isDragging, drawerX]);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      const screenWidth = window.innerWidth;
      const isEdgeTouch = touch.clientX >= screenWidth - EDGE_WIDTH;
      const isDrawerTouch = open && touch.clientX >= screenWidth - DRAWER_WIDTH;

      if (isEdgeTouch || isDrawerTouch) {
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          isEdge: isEdgeTouch && !open,
        };

        if (isEdgeTouch && !open) {
          setIsDragging(true);
        }
      }
    },
    [open]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      if (deltaY > 50 && !isDragging) {
        touchStartRef.current = null;
        return;
      }

      if (open || isDragging) {
        e.preventDefault();
      }

      if (touchStartRef.current.isEdge && !open) {
        const progress = Math.min(Math.max(-deltaX, 0), DRAWER_WIDTH);
        drawerX.set(DRAWER_WIDTH - progress);
        lastVelocityRef.current = -deltaX > 0 ? -1 : 1;
      } else if (open) {
        const newX = Math.max(0, Math.min(deltaX, DRAWER_WIDTH));
        drawerX.set(newX);
        lastVelocityRef.current = deltaX > 0 ? 1 : -1;
        if (!isDragging && deltaX > 10) {
          setIsDragging(true);
        }
      }
    },
    [open, isDragging, drawerX]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const currentX = drawerX.get();
      const velocity = lastVelocityRef.current * Math.abs(deltaX) * 10;

      if (touchStartRef.current.isEdge && !open) {
        const shouldOpen = velocity < -VELOCITY_THRESHOLD || currentX < DRAWER_WIDTH * POSITION_THRESHOLD;
        if (shouldOpen) {
          onOpenChange(true);
          drawerX.set(0);
        } else {
          drawerX.set(DRAWER_WIDTH);
        }
      } else if (open || isDragging) {
        const shouldClose = velocity > VELOCITY_THRESHOLD || currentX > DRAWER_WIDTH * POSITION_THRESHOLD;
        if (shouldClose) {
          onOpenChange(false);
          drawerX.set(DRAWER_WIDTH);
        } else {
          drawerX.set(0);
        }
      }

      touchStartRef.current = null;
      setIsDragging(false);
      lastVelocityRef.current = 0;
    },
    [open, isDragging, drawerX, onOpenChange]
  );

  useEffect(() => {
    if (!mounted) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [mounted, handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleOverlayClick = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (!mounted) return null;

  const showDrawer = open || isDragging || drawerX.get() < DRAWER_WIDTH;

  return createPortal(
    <>
      <motion.div
        className="swipe-drawer-overlay fixed inset-0 z-[100] bg-black pointer-events-none touch-none"
        style={{
          opacity: overlayOpacity,
          pointerEvents: open || isDragging ? "auto" : "none",
        }}
        onClick={handleOverlayClick}
        onTouchMove={(e) => e.preventDefault()}
      />

      <motion.div
        className={cn(
          "swipe-drawer-content fixed inset-y-0 right-0 z-[100] h-full w-[300px] bg-background border-l shadow-lg flex flex-col",
          className
        )}
        style={{ x: drawerX }}
      >
        {children}
      </motion.div>
    </>,
    document.body
  );
}

interface SwipeDrawerHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function SwipeDrawerHeader({ children, className }: SwipeDrawerHeaderProps) {
  return (
    <div className={cn("swipe-drawer-header flex flex-col gap-1.5 p-4", className)}>{children}</div>
  );
}

interface SwipeDrawerContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SwipeDrawerContent({ children, className }: SwipeDrawerContentProps) {
  return (
    <div className={cn("swipe-drawer-body flex-1 min-h-0 overflow-y-auto", className)}>{children}</div>
  );
}
