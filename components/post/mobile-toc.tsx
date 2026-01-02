"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { List } from "lucide-react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface MobileTocProps {
  content: string;
}

export function MobileToc({ content }: MobileTocProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const menuRef = useRef<HTMLDivElement>(null);
  const tocPanelRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  const toc = useMemo(() => {
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const headings: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w가-힣-]/g, "");

      headings.push({ id, text, level });
    }

    return headings;
  }, [content]);

  useEffect(() => {
    const handleScroll = () => {
      let currentActiveId = "";

      for (const item of toc) {
        const element = document.getElementById(item.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100) {
            currentActiveId = item.id;
          }
        }
      }

      if (currentActiveId) {
        setActiveId(currentActiveId);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [toc]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeItemRef.current && tocPanelRef.current) {
      const panel = tocPanelRef.current;
      const activeItem = activeItemRef.current;

      const panelRect = panel.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();

      if (itemRect.top < panelRect.top || itemRect.bottom > panelRect.bottom) {
        activeItem.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [activeId, isOpen]);

  const handleTocClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setIsOpen(false);
  };

  if (toc.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="mobile-toc-wrapper fixed bottom-4 right-4 z-40 xl:hidden"
    >
      <div
        ref={tocPanelRef}
        className={cn(
          "floating-toc-panel absolute bottom-16 right-0 w-64 max-h-72 overflow-y-auto rounded-2xl bg-white/90 dark:bg-black/80 backdrop-blur-2xl border border-white/40 dark:border-white/15 shadow-2xl p-3 transition-all duration-300 ease-out origin-bottom-right",
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2 pointer-events-none"
        )}
        style={{
          boxShadow:
            "0 4px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
        }}
      >
        <h3 className="floating-toc-header text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          목차
        </h3>
        <ul className="space-y-1">
          {toc.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li
                key={item.id}
                className={cn(item.level === 3 && "ml-3")}
              >
                <button
                  ref={isActive ? activeItemRef : null}
                  onClick={() => handleTocClick(item.id)}
                  className={cn(
                    "toc-item block w-full text-left text-sm py-1.5 px-2 rounded-lg transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {item.text}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "mobile-toc-trigger flex items-center justify-center w-14 h-14 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-2xl border border-white/40 dark:border-white/15 shadow-2xl text-foreground transition-all duration-300 hover:scale-110 active:scale-95",
          isOpen && "bg-primary/20 text-primary"
        )}
        style={{
          boxShadow:
            "0 4px 24px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
        }}
      >
        <List className="h-5 w-5" />
      </button>
    </div>
  );
}
