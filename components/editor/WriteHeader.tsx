"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { VisitorCount } from "@/components/analytics/VisitorCount";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Post", href: "/posts" },
  { label: "Short", href: "/short-posts" },
  { label: "Series", href: "/series" },
  { label: "Tags", href: "/tags" },
  { label: "About", href: "/about" },
];

interface WriteHeaderProps {
  isEditMode: boolean;
  isLoading: boolean;
  isSavingDraft: boolean;
  isFetchingPost: boolean;
  onTempSave: () => void;
  onPublish: () => void;
  onExit: () => void;
  isEditorFocused?: boolean;
}

export function WriteHeader({
  isEditMode,
  isLoading,
  isSavingDraft,
  isFetchingPost,
  onTempSave,
  onPublish,
  onExit,
  isEditorFocused = false,
}: WriteHeaderProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const isAtTop = currentScrollY < 10;
    const isScrollingDown = currentScrollY > lastScrollY;

    if (isAtTop) {
      setIsVisible(true);
    } else if (isScrollingDown) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }

    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const shouldShowHeader = isVisible && !isEditorFocused;

  return (
    <header
      className={cn(
        "write-header-wrapper fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 transition-transform duration-300 ease-in-out",
        !shouldShowHeader && "md:translate-y-0 -translate-y-full"
      )}
    >
      <div className="write-main-header border-b border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/logo-byungsker.png"
                alt="병스커 BLOG"
                width={180}
                height={84}
                className="logo-image rounded select-none"
                priority
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            </Link>

            <nav className="desktop-nav hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <VisitorCount />
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </div>

      <div className="write-sub-header border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between">
            <div className="write-header-left flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onExit}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">나가기</span>
              </Button>
              <h1 className="text-sm font-medium text-muted-foreground">
                {isEditMode ? "글 수정" : "글쓰기"}
              </h1>
            </div>
            <div className="write-header-right flex items-center gap-2">
              {!isEditMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onTempSave}
                  disabled={isLoading || isSavingDraft}
                >
                  {isSavingDraft ? "저장 중..." : "임시저장"}
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={onPublish}
                disabled={isLoading || isFetchingPost}
              >
                {isEditMode ? "수정하기" : "출간하기"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
