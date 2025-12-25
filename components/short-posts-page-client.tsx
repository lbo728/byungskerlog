"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { calculateReadingTime } from "@/lib/reading-time";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";

interface Series {
  id: string;
  name: string;
  slug: string;
}

interface ShortPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
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

interface ShortPostsData {
  posts: ShortPost[];
  pagination: Pagination;
}

interface ShortPostsPageClientProps {
  initialData: ShortPostsData;
  currentPage: number;
}

export function ShortPostsPageClient({ initialData, currentPage }: ShortPostsPageClientProps) {
  const user = useUser();
  const router = useRouter();

  const { data, isPending } = useQuery({
    queryKey: ["short-posts", "list", currentPage],
    queryFn: async () => {
      const response = await fetch(`/api/posts?page=${currentPage}&limit=20&type=SHORT`);
      if (!response.ok) throw new Error("Failed to fetch short posts");
      return response.json() as Promise<ShortPostsData>;
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
              href={`/posts/${post.slug}?from=short`}
              className="short-post-row flex items-center gap-4 py-4 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors"
            >
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
                <div className="short-post-tags flex items-center gap-1.5 shrink-0 hidden md:flex">
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
