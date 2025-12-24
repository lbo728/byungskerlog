"use client";

import { useState, useMemo, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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

  const handleTocClick = (id: string) => {
    setIsOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  if (toc.length === 0) return null;

  return (
    <div className="mobile-toc-wrapper fixed bottom-6 right-6 z-40 xl:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button size="icon" className="mobile-toc-trigger h-12 w-12 rounded-full shadow-lg">
            <List className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="mobile-toc-content w-[300px] sm:w-[350px]">
          <SheetHeader>
            <SheetTitle>목차</SheetTitle>
          </SheetHeader>
          <nav className="mobile-toc-nav mt-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <ul className="space-y-2">
              {toc.map((item) => (
                <li
                  key={item.id}
                  className={cn("transition-all duration-200", item.level === 2 && "ml-0", item.level === 3 && "ml-4")}
                >
                  <button
                    onClick={() => handleTocClick(item.id)}
                    className={cn(
                      "toc-item block w-full text-left text-sm py-2 px-3 rounded-md transition-all duration-200",
                      "hover:bg-accent hover:text-accent-foreground",
                      activeId === item.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground border-l-2 border-transparent"
                    )}
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
