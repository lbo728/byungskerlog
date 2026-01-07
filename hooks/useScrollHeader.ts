"use client";

import { useState, useEffect, useRef } from "react";

interface UseScrollHeaderOptions {
  threshold?: number;
  disabled?: boolean;
}

export function useScrollHeader(options: UseScrollHeaderOptions = {}) {
  const { threshold = 50, disabled = false } = options;
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<"up" | "down" | null>(null);
  const scrollAccumulator = useRef(0);

  useEffect(() => {
    if (disabled) {
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      if (currentScrollY < 10) {
        setIsVisible(true);
        scrollAccumulator.current = 0;
        scrollDirection.current = null;
      } else if (delta > 0) {
        if (scrollDirection.current !== "down") {
          scrollAccumulator.current = 0;
          scrollDirection.current = "down";
        }
        scrollAccumulator.current += delta;

        if (scrollAccumulator.current > threshold) {
          setIsVisible(false);
        }
      } else if (delta < 0) {
        if (scrollDirection.current !== "up") {
          scrollAccumulator.current = 0;
          scrollDirection.current = "up";
        }
        scrollAccumulator.current += Math.abs(delta);

        if (scrollAccumulator.current > threshold) {
          setIsVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold, disabled]);

  return disabled ? true : isVisible;
}
