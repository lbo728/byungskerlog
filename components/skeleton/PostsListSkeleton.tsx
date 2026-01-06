import { Skeleton } from "@/components/ui/Skeleton";

export function PostsListSkeleton() {
  return (
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
            <div className="post-item-thumbnail flex-shrink-0 self-start">
              <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-lg" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
