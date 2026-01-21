import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface PostListSkeletonProps {
  viewMode?: "card" | "list";
}

export function PostListSkeleton({ viewMode = "card" }: PostListSkeletonProps) {
  return (
    <div className="post-list-container">
      <nav className="post-list-tabs flex items-center justify-between mb-8">
        <div className="h-10 w-48" />
        <div className="h-10 w-20" />
      </nav>
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex flex-col overflow-hidden border-border/40 bg-card/50 py-0 pb-6">
              <Skeleton className="aspect-video w-full" />
              <CardHeader>
                <div className="flex flex-col gap-2 mb-3">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </div>
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-3/4 mt-1" />
              </CardHeader>
              <CardContent className="grow">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardContent>
              <CardFooter className="pt-0 mt-auto">
                <Skeleton className="h-5 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="post-list-view divide-y divide-border">
          {Array.from({ length: 10 }).map((_, i) => (
            <article key={i} className="post-item py-6">
              <div className="post-item-inner flex gap-4 sm:gap-6">
                <div className="post-item-content flex-1 min-w-0 flex flex-col">
                  <div className="flex gap-1.5 mb-2">
                    <Skeleton className="h-5 w-16" />
                  </div>
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
      )}
    </div>
  );
}
