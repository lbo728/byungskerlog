"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ content }: { content: string }) {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const headings: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

      headings.push({ id, text, level });
    }

    setToc(headings);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );

    const headingElements = document.querySelectorAll("h1, h2, h3");
    headingElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    <nav className="sticky top-24 hidden xl:block">
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 shadow-lg">
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
                    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
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
