"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { VisitorCount } from "@/components/visitor-count";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser, useStackApp } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { PenSquare, LogOut } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const user = useUser();
  const app = useStackApp();

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

          <nav className="flex items-center gap-6">
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
        </div>
      </div>
    </header>
  );
}
