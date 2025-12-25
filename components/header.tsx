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
import { Sheet, SheetContent, SheetHeader, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { PenSquare, LogOut, Menu, FileText, FolderOpen, ChevronDown, ChevronsRight } from "lucide-react";

const ALLOWED_EMAILS = ["extreme0728@gmail.com"];

export function Header() {
  const pathname = usePathname();
  const user = useUser();
  const app = useStackApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  const isAuthorized = user && user.primaryEmail && ALLOWED_EMAILS.includes(user.primaryEmail);

  const navItems = [
    { label: "Post", href: "/posts" },
    { label: "Series", href: "/series" },
    { label: "Tags", href: "/tags" },
    { label: "About", href: "/about" },
  ];

  const handleLogout = async () => {
    await app.signOut();
    setIsAdminMenuOpen(false);
  };

  return (
    <header className="header-wrapper sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
            {isAuthorized && (
              <Button variant="ghost" size="sm" onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)} className="gap-2">
                관리자
                <ChevronDown className={cn("h-4 w-4 transition-transform", isAdminMenuOpen && "rotate-180")} />
              </Button>
            )}
            <VisitorCount />
            <ThemeToggle />
          </nav>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]" hideCloseButton>
              <SheetHeader className="mobile-menu-header flex-row items-center justify-end">
                <SheetClose asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ChevronsRight className="h-5 w-5" />
                    접기
                  </Button>
                </SheetClose>
              </SheetHeader>
              <div className="mobile-menu-content flex flex-col gap-4 mt-4">
                <div className="nav-section flex flex-col gap-3">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "text-lg font-medium transition-colors hover:text-primary px-4 py-2",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                {isAuthorized && (
                  <div className="admin-section flex flex-col gap-2 py-4 border-t">
                    <Button asChild variant="default" size="default" onClick={() => setIsOpen(false)}>
                      <Link href="/admin/write" className="gap-2 w-full justify-start">
                        <PenSquare className="h-4 w-4" />
                        글쓰기
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="default" onClick={() => setIsOpen(false)}>
                      <Link href="/admin/drafts" className="gap-2 w-full justify-start">
                        <FileText className="h-4 w-4" />
                        임시저장
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="default" onClick={() => setIsOpen(false)}>
                      <Link href="/admin/posts" className="gap-2 w-full justify-start">
                        <FolderOpen className="h-4 w-4" />
                        포스트 관리
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

                <div className="visitor-section flex items-center justify-between py-4 border-t">
                  <VisitorCount />
                  <ThemeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {isAuthorized && isAdminMenuOpen && (
        <div className="admin-sub-gnb hidden md:block border-t border-border/40 bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-12 items-center gap-4">
              <Button asChild variant="ghost" size="sm" onClick={() => setIsAdminMenuOpen(false)}>
                <Link href="/admin/write" className="gap-2">
                  <PenSquare className="h-4 w-4" />
                  글쓰기
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" onClick={() => setIsAdminMenuOpen(false)}>
                <Link href="/admin/drafts" className="gap-2">
                  <FileText className="h-4 w-4" />
                  임시저장
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" onClick={() => setIsAdminMenuOpen(false)}>
                <Link href="/admin/posts" className="gap-2">
                  <FolderOpen className="h-4 w-4" />
                  포스트 관리
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
