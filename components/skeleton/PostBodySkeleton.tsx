import { Skeleton } from "@/components/ui/Skeleton";
import { Separator } from "@/components/ui/Separator";

export function PostBodySkeleton() {
  return (
    <div className="bg-background">
      <div className="post-detail-layout relative">
        <div className="post-content-center flex justify-center px-4 sm:px-6 lg:px-8">
          <div className="post-main-content max-w-5xl w-full xl:pr-24">
            <div className="prose-skeleton space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-5/6" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>

            <Separator className="my-12" />

            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </nav>

            <Separator className="my-12" />

            <Skeleton className="h-8 w-32 mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>

            <Separator className="my-12" />

            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
