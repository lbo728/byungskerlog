"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
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
import { useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface WriteTocProps {
  content: string;
  editorSelector?: string;
}

function extractHeadings(content: string): TocItem[] {
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
}

function scrollToHeading(text: string, editorSelector: string = ".tiptap-editor") {
  const editor = document.querySelector(editorSelector);
  if (!editor) return;

  const headings = editor.querySelectorAll("h1, h2, h3");
  for (const heading of headings) {
    if (heading.textContent?.trim() === text) {
      heading.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      break;
    }
  }
}

export function WriteTocDesktop({ content, editorSelector }: WriteTocProps) {
  const toc = useMemo(() => extractHeadings(content), [content]);

  if (toc.length === 0) return null;

  return (
    <nav className="write-toc-desktop sticky top-32 hidden xl:block">
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 shadow-lg max-h-[calc(100vh-10rem)] overflow-y-auto">
        <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
          목차
        </h2>
        <ul className="space-y-2.5">
          {toc.map((item, index) => (
            <li
              key={`${item.id}-${index}`}
              className={cn(
                "transition-all duration-200",
                item.level === 1 && "ml-0",
                item.level === 2 && "ml-0",
                item.level === 3 && "ml-4"
              )}
            >
              <button
                onClick={() => scrollToHeading(item.text, editorSelector)}
                className={cn(
                  "toc-item block w-full text-left text-sm py-1.5 px-3 rounded-md transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground",
                  "text-muted-foreground border-l-2 border-transparent"
                )}
              >
                {item.text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function WriteTocMobile({ content, editorSelector }: WriteTocProps) {
  const [isOpen, setIsOpen] = useState(false);
  const toc = useMemo(() => extractHeadings(content), [content]);

  const handleTocClick = (text: string) => {
    scrollToHeading(text, editorSelector);
    setIsOpen(false);
  };

  if (toc.length === 0) return null;

  return (
    <div className="write-toc-mobile fixed bottom-4 right-4 z-40 xl:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            className="write-toc-trigger flex items-center justify-center w-14 h-14 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-2xl border border-white/40 dark:border-white/15 shadow-2xl text-foreground transition-all duration-300 hover:scale-110 active:scale-95"
            style={{
              boxShadow:
                "0 4px 24px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
            }}
          >
            <List className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="write-toc-content w-[300px] sm:w-[350px]"
          hideCloseButton
        >
          <SheetHeader>
            <SheetTitle>목차</SheetTitle>
          </SheetHeader>
          <nav className="write-toc-nav mt-6 flex-1 overflow-y-auto">
            <ul className="space-y-2">
              {toc.map((item, index) => (
                <li
                  key={`${item.id}-${index}`}
                  className={cn(
                    "transition-all duration-200",
                    item.level === 1 && "ml-0",
                    item.level === 2 && "ml-0",
                    item.level === 3 && "ml-4"
                  )}
                >
                  <button
                    onClick={() => handleTocClick(item.text)}
                    className={cn(
                      "toc-item block w-full text-left text-sm py-2 px-3 rounded-md transition-all duration-200",
                      "hover:bg-accent hover:text-accent-foreground",
                      "text-muted-foreground border-l-2 border-transparent"
                    )}
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <SheetFooter className="write-toc-footer flex-row justify-end mb-4">
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
