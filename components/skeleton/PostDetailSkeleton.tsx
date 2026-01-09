import { Skeleton } from "@/components/ui/Skeleton";
import { Separator } from "@/components/ui/Separator";

export function PostDetailSkeleton() {
  return (
    <div className="bg-background">
      <div className="post-detail-layout relative py-12">
        <div className="post-content-center flex justify-center px-4 sm:px-6 lg:px-8">
          <div className="post-main-content max-w-3xl w-full">
            <Skeleton className="h-5 w-16 mb-6" />

            <article>
              <header className="mb-8">
                <Skeleton className="h-10 sm:h-12 w-full mb-4" />
                <Skeleton className="h-10 sm:h-12 w-3/4 mb-4" />
                <div className="post-header-meta flex gap-4 flex-col">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-16 rounded" />
                    <Skeleton className="h-6 w-20 rounded" />
                    <Skeleton className="h-6 w-14 rounded" />
                  </div>
                </div>
              </header>

              <Separator className="my-8" />

              <Skeleton className="w-full aspect-video mb-8 rounded-lg" />

              <div className="prose-skeleton space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-6 w-2/5 mt-8" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-32 w-full rounded-lg mt-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </article>

            <Separator className="my-12" />

            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
