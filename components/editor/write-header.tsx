"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { VisitorCount } from "@/components/analytics/visitor-count";
import { cn } from "@/lib/utils";
import type { SaveStatus } from "@/hooks/useAutoSave";

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
  saveStatus?: SaveStatus;
  onTempSave: () => void;
  onPublish: () => void;
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  const statusConfig = {
    saved: {
      icon: Check,
      text: "저장됨",
      className: "text-green-600 dark:text-green-400",
    },
    saving: {
      icon: Loader2,
      text: "저장 중...",
      className: "text-muted-foreground animate-spin",
    },
    unsaved: {
      icon: Circle,
      text: "저장되지 않음",
      className: "text-amber-500 dark:text-amber-400",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="save-status-indicator flex items-center gap-1.5 text-xs">
      <Icon className={cn("h-3.5 w-3.5", config.className)} />
      <span className="text-muted-foreground hidden sm:inline">{config.text}</span>
    </div>
  );
}

export function WriteHeader({
  isEditMode,
  isLoading,
  isSavingDraft,
  isFetchingPost,
  saveStatus,
  onTempSave,
  onPublish,
}: WriteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <header className="write-header-wrapper fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
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
                onClick={() => router.push("/admin/posts")}
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
              {!isEditMode && saveStatus && (
                <SaveStatusIndicator status={saveStatus} />
              )}
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
