import { Skeleton } from "@/components/ui/Skeleton";
import { ShortPostsSkeleton } from "@/components/skeleton/ShortPostsSkeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="short-posts-header flex items-baseline gap-3 mb-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-8" />
        </div>
        <ShortPostsSkeleton />
      </div>
    </div>
  );
}
