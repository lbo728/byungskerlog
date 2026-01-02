"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
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
import { List, ChevronsRight, Plus, X, Image as ImageIcon } from "lucide-react";

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

function useActiveHeading(toc: TocItem[], editorSelector: string = ".tiptap-editor") {
  const [activeText, setActiveText] = useState<string>("");

  const updateActiveHeading = useCallback(() => {
    const editor = document.querySelector(editorSelector);
    if (!editor) return;

    const headings = editor.querySelectorAll("h1, h2, h3");
    let currentActiveText = "";

    // 헤더 높이(7rem = 112px) + 여유 공간을 고려한 임계값
    const threshold = 180;

    for (const heading of headings) {
      const rect = heading.getBoundingClientRect();
      if (rect.top <= threshold) {
        currentActiveText = heading.textContent?.trim() || "";
      }
    }

    if (currentActiveText) {
      setActiveText(currentActiveText);
    }
  }, [editorSelector]);

  useEffect(() => {
    const editor = document.querySelector(editorSelector);
    const editorContainer = editor?.closest(".tiptap-editor");

    // window 스크롤과 에디터 컨테이너 스크롤 모두 감지
    window.addEventListener("scroll", updateActiveHeading, { passive: true });
    editorContainer?.addEventListener("scroll", updateActiveHeading, { passive: true });

    // 초기 실행 (비동기로 실행하여 cascading render 방지)
    const initialTimeout = setTimeout(updateActiveHeading, 0);

    // 콘텐츠 변경 시에도 업데이트
    const interval = setInterval(updateActiveHeading, 500);

    return () => {
      window.removeEventListener("scroll", updateActiveHeading);
      editorContainer?.removeEventListener("scroll", updateActiveHeading);
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [updateActiveHeading, toc, editorSelector]);

  return activeText;
}

export function WriteTocDesktop({ content, editorSelector = ".tiptap-editor" }: WriteTocProps) {
  const toc = useMemo(() => extractHeadings(content), [content]);
  const activeText = useActiveHeading(toc, editorSelector);
  const tocContainerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // 활성 항목이 변경되면 TOC 내에서 자동 스크롤
  useEffect(() => {
    if (activeItemRef.current && tocContainerRef.current) {
      const container = tocContainerRef.current;
      const activeItem = activeItemRef.current;

      const containerRect = container.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();

      // 활성 항목이 컨테이너 뷰포트 밖에 있으면 스크롤
      if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
        activeItem.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [activeText]);

  if (toc.length === 0) return null;

  return (
    <nav className="write-toc-desktop sticky top-32 hidden xl:block">
      <div
        ref={tocContainerRef}
        className="toc-container p-6 max-h-[calc(100vh-10rem)] overflow-y-auto bg-transparent"
      >
        <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
          목차
        </h2>
        <ul className="space-y-2.5">
          {toc.map((item, index) => {
            const isActive = activeText === item.text;
            return (
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
                  ref={isActive ? activeItemRef : null}
                  onClick={() => scrollToHeading(item.text, editorSelector)}
                  className={cn(
                    "toc-item block w-full text-left text-sm py-1.5 px-3 rounded-md transition-all duration-200",
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
      </div>
    </nav>
  );
}

export function WriteTocMobile({ content, editorSelector = ".tiptap-editor" }: WriteTocProps) {
  const [isOpen, setIsOpen] = useState(false);
  const toc = useMemo(() => extractHeadings(content), [content]);
  const activeText = useActiveHeading(toc, editorSelector);

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
                      activeText === item.text
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

interface WriteFloatingMenuProps extends WriteTocProps {
  onImageUpload: () => void;
}

export function WriteFloatingMenu({
  content,
  editorSelector = ".tiptap-editor",
  onImageUpload,
}: WriteFloatingMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const toc = useMemo(() => extractHeadings(content), [content]);
  const activeText = useActiveHeading(toc, editorSelector);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleTocClick = (text: string) => {
    scrollToHeading(text, editorSelector);
    setShowToc(false);
    setIsOpen(false);
  };

  const handleImageClick = () => {
    onImageUpload();
    setIsOpen(false);
  };

  const handleToggleToc = () => {
    setShowToc(!showToc);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowToc(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      ref={menuRef}
      className="write-floating-menu fixed bottom-4 right-4 z-40 xl:hidden flex items-end gap-2"
    >
      <div
        className={cn(
          "floating-menu-panel flex items-center gap-2 transition-all duration-300 ease-out origin-right",
          isOpen
            ? "opacity-100 scale-100 translate-x-0"
            : "opacity-0 scale-95 translate-x-4 pointer-events-none"
        )}
      >
        {showToc && toc.length > 0 && (
          <div
            className="floating-toc-panel absolute bottom-16 right-0 w-64 max-h-72 overflow-y-auto rounded-2xl bg-white/90 dark:bg-black/80 backdrop-blur-2xl border border-white/40 dark:border-white/15 shadow-2xl p-3"
            style={{
              boxShadow:
                "0 4px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
            }}
          >
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              목차
            </h3>
            <ul className="space-y-1">
              {toc.map((item, index) => (
                <li
                  key={`${item.id}-${index}`}
                  className={cn(item.level === 3 && "ml-3")}
                >
                  <button
                    onClick={() => handleTocClick(item.text)}
                    className={cn(
                      "toc-item block w-full text-left text-sm py-1.5 px-2 rounded-lg transition-all duration-200",
                      "hover:bg-accent hover:text-accent-foreground",
                      activeText === item.text
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleImageClick}
          className="floating-menu-item flex items-center justify-center w-12 h-12 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-2xl border border-white/40 dark:border-white/15 shadow-xl text-foreground transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            boxShadow:
              "0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
          }}
        >
          <ImageIcon className="h-5 w-5" />
        </button>

        {toc.length > 0 && (
          <button
            onClick={handleToggleToc}
            className={cn(
              "floating-menu-item flex items-center justify-center w-12 h-12 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-2xl border border-white/40 dark:border-white/15 shadow-xl text-foreground transition-all duration-200 hover:scale-105 active:scale-95",
              showToc && "bg-primary/20 text-primary"
            )}
            style={{
              boxShadow:
                "0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
            }}
          >
            <List className="h-5 w-5" />
          </button>
        )}
      </div>

      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (isOpen) setShowToc(false);
        }}
        className={cn(
          "floating-menu-trigger flex items-center justify-center w-14 h-14 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-2xl border border-white/40 dark:border-white/15 shadow-2xl text-foreground transition-all duration-300 hover:scale-110 active:scale-95",
          isOpen && "rotate-45"
        )}
        style={{
          boxShadow:
            "0 4px 24px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
        }}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </button>
    </div>
  );
}
