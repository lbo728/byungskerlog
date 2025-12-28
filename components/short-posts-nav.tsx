"use client";

import { useState } from "react";
import Link from "next/link";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, ChevronDown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShortPost {
  slug: string;
  title: string;
}

interface ShortPostsNavProps {
  prevShortPost: ShortPost | null;
  nextShortPost: ShortPost | null;
}

export function ShortPostsNav({ prevShortPost, nextShortPost }: ShortPostsNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!prevShortPost && !nextShortPost) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="short-posts-nav mt-12">
      <CollapsibleTrigger className="short-posts-nav-trigger flex items-center justify-between w-full py-3 px-4 rounded-lg bg-violet-500/5 hover:bg-violet-500/10 border border-violet-500/20 transition-colors">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-medium text-violet-500">다른 짧은 글</span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-violet-500 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="short-posts-nav-content">
        <nav className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          {prevShortPost ? (
            <Link href={`/short/${prevShortPost.slug}`} className="group">
              <Card className="h-full transition-colors hover:border-violet-500/50 border-violet-500/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center text-sm text-violet-500 mb-2">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    이전 짧은 글
                  </div>
                  <CardTitle className="text-base group-hover:text-violet-500 transition-colors line-clamp-2">
                    {prevShortPost.title}
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ) : (
            <div />
          )}
          {nextShortPost ? (
            <Link href={`/short/${nextShortPost.slug}`} className="group">
              <Card className="h-full transition-colors hover:border-violet-500/50 border-violet-500/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-end text-sm text-violet-500 mb-2">
                    다음 짧은 글
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                  <CardTitle className="text-base text-right group-hover:text-violet-500 transition-colors line-clamp-2">
                    {nextShortPost.title}
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </CollapsibleContent>
    </Collapsible>
  );
}
