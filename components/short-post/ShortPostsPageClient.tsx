"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { calculateReadingTime } from "@/lib/reading-time";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useShortPosts, type ShortPostsData } from "@/hooks/useShortPosts";
import { useDeletePost } from "@/hooks/useDeletePost";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";

interface ShortPostsPageClientProps {
  initialData: ShortPostsData;
  currentPage: number;
}

export function ShortPostsPageClient({ initialData, currentPage }: ShortPostsPageClientProps) {
  const user = useUser();
  const router = useRouter();
  const { handleLinkClick } = useScrollRestoration("short-posts", currentPage);

  const { data, isPending } = useShortPosts({
    page: currentPage,
    limit: 20,
    initialData,
  });

  const { deletePost } = useDeletePost();

  const handleDelete = async (postId: string, postTitle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await deletePost(postId, postTitle);
  };

  const handleEdit = (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/admin/write?id=${postId}`);
  };

  if (isPending || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { posts, pagination } = data;

  if (posts.length === 0) {
    return (
      <div className="short-posts-empty text-center py-20">
        <p className="text-muted-foreground text-lg">아직 작성된 Short Post가 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="short-posts-list divide-y divide-border">
        {posts.map((post) => (
          <li key={post.id} className="short-post-item group">
            <Link
              href={`/short/${post.slug}`}
              className="short-post-link block py-4 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors"
              onClick={handleLinkClick}
            >
              <div className="short-post-row flex items-center gap-4">
                <time
                  dateTime={new Date(post.createdAt).toISOString()}
                  className="short-post-date text-sm text-muted-foreground shrink-0 w-[85px]"
                >
                  {format(new Date(post.createdAt), "yyyy.MM.dd")}
                </time>

                <span className="short-post-title flex-1 font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {post.title}
                </span>

                <span className="short-post-reading-time text-sm text-muted-foreground shrink-0 hidden sm:block">
                  {calculateReadingTime(post.content)}
                </span>

                {post.tags && post.tags.length > 0 && (
                  <div className="short-post-tags items-center gap-1.5 shrink-0 hidden md:flex">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="tag-item px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                    {post.tags.length > 2 && (
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                )}

                {user && (
                  <div className="short-post-actions flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => handleEdit(post.id, e)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => handleDelete(post.id, post.title, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Mobile: 2nd row for reading time and tags */}
              <div className="short-post-mobile-meta flex items-center gap-2 mt-1.5 ml-[101px] sm:hidden">
                <span className="text-xs text-muted-foreground">
                  {calculateReadingTime(post.content)}
                </span>
                {post.tags && post.tags.length > 0 && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <div className="flex items-center gap-1">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 text-xs rounded bg-muted text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{post.tags.length - 2}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {pagination.totalPages > 1 && (
        <div className="short-posts-pagination flex items-center justify-center gap-2 mt-10">
          <Button
            variant="outline"
            size="sm"
            asChild
            disabled={pagination.page === 1}
            className={pagination.page === 1 ? "pointer-events-none opacity-50" : ""}
          >
            <Link href={`/short-posts?page=${pagination.page - 1}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              이전
            </Link>
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
              <Button key={pageNum} variant={pageNum === pagination.page ? "default" : "outline"} size="sm" asChild>
                <Link href={`/short-posts?page=${pageNum}`}>{pageNum}</Link>
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            asChild
            disabled={pagination.page === pagination.totalPages}
            className={pagination.page === pagination.totalPages ? "pointer-events-none opacity-50" : ""}
          >
            <Link href={`/short-posts?page=${pagination.page + 1}`}>
              다음
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}
