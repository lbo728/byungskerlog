"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      <div className="short-posts-table rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60%]">제목</TableHead>
              <TableHead className="hidden sm:table-cell">읽는 시간</TableHead>
              <TableHead className="text-right">작성일</TableHead>
              {user && <TableHead className="w-[100px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id} className="group">
                <TableCell>
                  <Link
                    href={`/posts/${post.slug}?from=short`}
                    className="short-post-link block hover:text-primary transition-colors"
                  >
                    <div className="short-post-title-wrapper flex flex-col gap-1">
                      <span className="short-post-title font-medium text-base group-hover:text-primary transition-colors">
                        {post.title}
                      </span>
                      <div className="short-post-badges flex items-center gap-2 flex-wrap">
                        {post.series && (
                          <Badge
                            variant="secondary"
                            className="series-badge bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0 text-xs"
                          >
                            <BookOpen className="h-3 w-3 mr-1" />
                            {post.series.name}
                          </Badge>
                        )}
                        {post.tags && post.tags.length > 0 && (
                          <>
                            {post.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs font-normal">
                                {tag}
                              </Badge>
                            ))}
                            {post.tags.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{post.tags.length - 2}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                  {calculateReadingTime(post.content)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-sm whitespace-nowrap">
                  <time dateTime={new Date(post.createdAt).toISOString()}>
                    {format(new Date(post.createdAt), "yyyy.MM.dd")}
                  </time>
                </TableCell>
                {user && (
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
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
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
