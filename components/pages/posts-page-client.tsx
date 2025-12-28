"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronLeft, ChevronRight, Loader2, Pencil, Trash2 } from "lucide-react";
import { calculateReadingTime } from "@/lib/reading-time";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";

interface Series {
  id: string;
  name: string;
  slug: string;
}

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  thumbnail: string | null;
  tags: string[];
  createdAt: Date;
  series: Series | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PostsData {
  posts: Post[];
  pagination: Pagination;
}

interface PostsPageClientProps {
  initialData: PostsData;
  currentPage: number;
}

export function PostsPageClient({ initialData, currentPage }: PostsPageClientProps) {
  const user = useUser();
  const router = useRouter();

  const { data, isPending } = useQuery({
    queryKey: ["posts", "list", currentPage],
    queryFn: async () => {
      const response = await fetch(`/api/posts?page=${currentPage}&limit=20`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json() as Promise<PostsData>;
    },
    initialData,
    staleTime: 5 * 60 * 1000,
  });

  const handleDelete = async (postId: string, postTitle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`"${postTitle}" 포스트를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      toast.success("포스트가 삭제되었습니다.");
      router.refresh();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("포스트 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleEdit = (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/admin/write?id=${postId}`);
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { posts, pagination } = data;

  return (
    <>
      <div className="post-list-grid grid gap-0 divide-y divide-border">
        {posts.map((post) => {
          const hasThumbnail = post.thumbnail && !post.thumbnail.includes("og-image");

          return (
            <article key={post.id} className="post-item relative">
              <Link href={`/posts/${post.slug}`} className="group block py-6">
                <div className="post-item-inner flex gap-4 sm:gap-6">
                  {/* Content */}
                  <div className="post-item-content flex-1 min-w-0 flex flex-col">
                    {/* Series Badge */}
                    {post.series && (
                      <Badge
                        variant="secondary"
                        className="series-badge self-start mb-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0 text-xs"
                      >
                        <BookOpen className="h-3 w-3 mr-1" />
                        {post.series.name}
                      </Badge>
                    )}

                    {/* Title */}
                    <h2 className="post-item-title text-lg sm:text-xl font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>

                    {/* Excerpt - hidden on mobile for cleaner look */}
                    {post.excerpt && (
                      <p className="post-item-excerpt hidden sm:block mt-2 text-muted-foreground text-sm line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Meta: Date, Reading Time */}
                    <div className="post-item-meta flex items-center gap-2 mt-3 text-xs sm:text-sm text-muted-foreground">
                      <time dateTime={new Date(post.createdAt).toISOString()}>
                        {format(new Date(post.createdAt), "MMM d, yyyy")}
                      </time>
                      <span>·</span>
                      <span>{calculateReadingTime(post.content)}</span>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="post-item-tags flex flex-wrap gap-1.5 mt-3">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{post.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail */}
                  {hasThumbnail && (
                    <div className="post-item-thumbnail flex-shrink-0 self-start">
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={post.thumbnail!}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, 144px"
                        />
                      </div>
                    </div>
                  )}

                  {/* Admin Actions */}
                  {user && (
                    <div className="post-item-actions flex flex-col gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEdit(post.id, e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => handleDelete(post.id, post.title, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Link>
            </article>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <Button
            variant="outline"
            size="sm"
            asChild
            disabled={pagination.page === 1}
            className={pagination.page === 1 ? "pointer-events-none opacity-50" : ""}
          >
            <Link href={`/posts?page=${pagination.page - 1}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Link>
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
              <Button key={pageNum} variant={pageNum === pagination.page ? "default" : "outline"} size="sm" asChild>
                <Link href={`/posts?page=${pageNum}`}>{pageNum}</Link>
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
            <Link href={`/posts?page=${pagination.page + 1}`}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}
