"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { List, ChevronsRight } from "lucide-react";
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
  const tocContainerRef = useRef<HTMLElement>(null);
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

  // 활성 항목이 변경되면 TOC 내에서 자동 스크롤
  useEffect(() => {
    if (activeItemRef.current && tocContainerRef.current) {
      const container = tocContainerRef.current;
      const activeItem = activeItemRef.current;

      const containerRect = container.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();

      if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
        activeItem.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [activeId]);

  const handleTocClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  if (toc.length === 0) return null;

  return (
    <div className="mobile-toc-wrapper fixed bottom-4 right-4 z-40 xl:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            className="mobile-toc-trigger flex items-center justify-center w-14 h-14 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-2xl border border-white/40 dark:border-white/15 shadow-2xl text-foreground transition-all duration-300 hover:scale-110 active:scale-95"
            style={{
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
            }}
          >
            <List className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="mobile-toc-content w-[300px] sm:w-[350px]" hideCloseButton>
          <SheetHeader>
            <SheetTitle>목차</SheetTitle>
          </SheetHeader>
          <nav ref={tocContainerRef} className="mobile-toc-nav mt-6 flex-1 overflow-y-auto">
            <ul className="space-y-2">
              {toc.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <li
                    key={item.id}
                    className={cn("transition-all duration-200", item.level === 2 && "ml-0", item.level === 3 && "ml-4")}
                  >
                    <button
                      ref={isActive ? activeItemRef : null}
                      onClick={() => handleTocClick(item.id)}
                      className={cn(
                        "toc-item block w-full text-left text-sm py-2 px-3 rounded-md transition-all duration-200",
                        "hover:bg-accent hover:text-accent-foreground",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground border-l-2 border-transparent"
                      )}
                    >
                      {item.text}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          <SheetFooter className="mobile-toc-footer flex-row justify-end mb-4">
            <SheetClose asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ChevronsRight className="h-4 w-4" />
                접기
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
