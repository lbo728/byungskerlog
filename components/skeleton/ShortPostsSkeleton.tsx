import { Skeleton } from "@/components/ui/Skeleton";

interface ShortPostsSkeletonProps {
  showHeader?: boolean;
}

export function ShortPostsSkeleton({ showHeader = false }: ShortPostsSkeletonProps) {
  return (
    <>
      {showHeader && (
        <div className="short-posts-header flex items-baseline gap-3 mb-8">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-6 w-8" />
        </div>
      )}
      <ul className="short-posts-list divide-y divide-border">
      {Array.from({ length: 10 }).map((_, i) => (
        <li key={i} className="short-post-item py-4">
          <div className="short-post-row flex items-center gap-4">
            <Skeleton className="h-4 w-[85px] shrink-0" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-4 w-16 shrink-0 hidden sm:block" />
            <div className="hidden md:flex items-center gap-1.5 shrink-0">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        </li>
      ))}
      </ul>
    </>
  );
}
