import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function PostListSkeleton() {
  return (
    <div className="post-list-container">
      <nav className="post-list-tabs mb-8">
        <div className="h-10 w-48" />
      </nav>
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
    </div>
  );
}
