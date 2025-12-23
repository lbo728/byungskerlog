"use client";

import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ content }: { content: string }) {
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

  if (toc.length === 0) return null;

  return (
    <nav className="sticky top-24 hidden xl:block">
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 shadow-lg max-h-[calc(100vh-8rem)] overflow-y-auto">
        <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">목차</h2>
        <ul className="space-y-2.5">
          {toc.map((item) => (
            <li
              key={item.id}
              className={cn("transition-all duration-200", item.level === 2 && "ml-0", item.level === 3 && "ml-4")}
            >
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className={cn(
                  "block text-sm py-1.5 px-3 rounded-md transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground",
                  activeId === item.id
                    ? "bg-primary/10 text-primary font-medium "
                    : "text-muted-foreground border-l-2 border-transparent"
                )}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
