import { Skeleton } from "@/components/ui/Skeleton";

interface PostsListSkeletonProps {
  showHeader?: boolean;
}

export function PostsListSkeleton({ showHeader = false }: PostsListSkeletonProps) {
  return (
    <>
      {showHeader && (
        <div className="posts-header flex items-baseline gap-3 mb-8">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-6 w-8" />
        </div>
      )}
      <div className="post-list-grid grid gap-0 divide-y divide-border">
        {Array.from({ length: 10 }).map((_, i) => (
          <article key={i} className="post-item py-6">
            <div className="post-item-inner flex gap-4 sm:gap-6">
              <div className="post-item-content flex-1 min-w-0 flex flex-col">
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4 mt-1" />
                <Skeleton className="hidden sm:block h-4 w-full mt-2" />
                <Skeleton className="hidden sm:block h-4 w-2/3 mt-1" />
                <div className="flex items-center gap-2 mt-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Skeleton className="h-5 w-12 rounded" />
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-5 w-10 rounded" />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
