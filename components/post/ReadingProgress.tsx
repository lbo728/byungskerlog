"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function ReadingProgress() {
  const progressRef = useRef<HTMLDivElement>(null);
  const progressValue = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const article = document.querySelector("article");
      if (!article) return;

      const scrollTop = window.scrollY;
      const articleRect = article.getBoundingClientRect();
      const articleBottom = scrollTop + articleRect.bottom;
      const readableHeight = articleBottom - window.innerHeight;
      const scrollPercent = readableHeight > 0 ? (scrollTop / readableHeight) * 100 : 0;
      const targetProgress = Math.min(100, Math.max(0, scrollPercent));

      if (progressRef.current && Math.abs(targetProgress - progressValue.current) > 0.1) {
        gsap.to(progressRef.current, {
          width: `${targetProgress}%`,
          duration: 0.3,
          ease: "power2.out",
        });
        progressValue.current = targetProgress;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="reading-progress-container fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
      <div ref={progressRef} className="reading-progress-bar h-full bg-primary" style={{ width: "0%" }} />
    </div>
  );
}
