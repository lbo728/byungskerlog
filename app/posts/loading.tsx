import { Skeleton } from "@/components/ui/Skeleton";
import { PostsListSkeleton } from "@/components/skeleton/PostsListSkeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="posts-header flex items-baseline gap-3 mb-8">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-6 w-8" />
        </div>
        <PostsListSkeleton />
      </div>
    </div>
  );
}
