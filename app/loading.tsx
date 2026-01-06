import { PostListSkeleton } from "@/components/skeleton/PostListSkeleton";

export default function Loading() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <PostListSkeleton />
    </div>
  );
}
