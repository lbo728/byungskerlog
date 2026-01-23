"use client";

import { cn } from "@/lib/utils";

interface CommentSkeletonProps {
  count?: number;
}

function SkeletonItem({ hasReplies = false }: { hasReplies?: boolean }) {
  return (
    <div className="comment-skeleton-item py-4 animate-pulse">
      <div className="comment-skeleton-header flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
      </div>
      <div className="comment-skeleton-body mt-3 space-y-2">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
      </div>
      <div className="comment-skeleton-footer mt-3 flex items-center gap-2">
        <div className="h-7 w-12 rounded bg-muted" />
        <div className="h-7 w-12 rounded bg-muted" />
        <div className="h-7 w-7 rounded bg-muted" />
      </div>

      {hasReplies && (
        <div className="comment-skeleton-reply ml-6 pl-4 border-l-2 border-muted mt-4">
          <div className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex flex-col gap-2">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-2 w-12 rounded bg-muted" />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CommentSkeleton({ count = 3 }: CommentSkeletonProps) {
  return (
    <div className="comment-skeleton-list divide-y">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonItem key={index} hasReplies={index === 0} />
      ))}
    </div>
  );
}
