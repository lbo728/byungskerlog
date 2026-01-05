import { ArrowLeft } from "lucide-react";

export default function PostLoading() {
  return (
    <div className="post-loading-container bg-background">
      <div className="post-detail-layout relative py-12">
        <div className="post-content-center flex justify-center px-4 sm:px-6 lg:px-8">
          <div className="post-main-content max-w-3xl w-full">
            <div className="back-to-posts inline-flex items-center gap-1 text-sm text-muted-foreground mb-6">
              <ArrowLeft className="h-4 w-4" />
              <span>Post</span>
            </div>

            <article>
              <header className="mb-8">
                <div className="title-skeleton h-10 sm:h-12 md:h-14 lg:h-16 w-full bg-muted rounded animate-pulse mb-4" />
                <div className="meta-skeleton flex flex-col gap-2">
                  <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-36 bg-muted rounded animate-pulse" />
                </div>
              </header>

              <div className="post-content-skeleton space-y-4 mt-8">
                <div className="skeleton-line h-4 w-full bg-muted rounded animate-pulse" />
                <div className="skeleton-line h-4 w-[80%] bg-muted rounded animate-pulse" />
                <div className="skeleton-line h-4 w-[30%] bg-muted rounded animate-pulse" />
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
