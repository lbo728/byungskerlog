"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { VisitorCount } from "@/components/visitor-count";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser, useStackApp } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PenSquare, LogOut, Menu } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const user = useUser();
  const app = useStackApp();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Post", href: "/posts" },
    { label: "Tags", href: "/tags" },
    { label: "About", href: "/about" },
  ];

  const handleLogout = async () => {
    await app.signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/logo-byungsker.png"
              alt="병스커 BLOG"
              width={180}
              height={84}
              className="rounded"
              priority
            />
          </Link>

          {/* 데스크톱 네비게이션 (md 이상) */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <>
                <Button asChild variant="default" size="sm">
                  <Link href="/admin/write" className="gap-2">
                    <PenSquare className="h-4 w-4" />
                    글쓰기
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </Button>
              </>
            )}
            <VisitorCount />
            <ThemeToggle />
          </nav>

          {/* 모바일 메뉴 버튼 (md 미만) */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>메뉴</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                {/* 네비게이션 링크 */}
                <div className="flex flex-col gap-3">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "text-lg font-medium transition-colors hover:text-primary px-2 py-2",
                        pathname === item.href ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* 사용자 관련 버튼 */}
                {user && (
                  <div className="flex flex-col gap-2 pt-4 border-t">
                    <Button asChild variant="default" size="default" onClick={() => setIsOpen(false)}>
                      <Link href="/admin/write" className="gap-2 w-full justify-start">
                        <PenSquare className="h-4 w-4" />
                        글쓰기
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="gap-2 w-full justify-start"
                    >
                      <LogOut className="h-4 w-4" />
                      로그아웃
                    </Button>
                  </div>
                )}

                {/* 조회수 및 테마 토글 */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <VisitorCount />
                  <ThemeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
