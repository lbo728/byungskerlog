"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="grid gap-6">
        {posts.map((post) => {
          const hasThumbnail = post.thumbnail && !post.thumbnail.includes("og-image");

          return (
            <div key={post.id} className="relative">
              <Link href={`/posts/${post.slug}`} className="group block">
                <Card className="post-card transition-colors hover:border-primary">
                  <div className={`post-card-inner flex ${hasThumbnail ? "gap-4" : ""}`}>
                    <div className="post-card-content flex-1 min-w-0">
                      <CardHeader>
                        <div className="post-meta flex items-center justify-between gap-2 mb-2">
                          <div className="post-info flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                            {post.series && (
                              <Badge
                                variant="secondary"
                                className="series-badge bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0"
                              >
                                <BookOpen className="h-3 w-3 mr-1" />
                                {post.series.name}
                              </Badge>
                            )}
                            <time dateTime={new Date(post.createdAt).toISOString()}>
                              {format(new Date(post.createdAt), "MMMM d, yyyy")}
                            </time>
                            <span>·</span>
                            <span>{calculateReadingTime(post.content)}</span>
                          </div>
                          {user && (
                            <div className="flex items-center gap-2">
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
                        <CardTitle className="text-2xl group-hover:text-primary transition-colors">{post.title}</CardTitle>
                        {post.excerpt && <CardDescription className="line-clamp-2 text-base">{post.excerpt}</CardDescription>}
                      </CardHeader>
                      {post.tags && post.tags.length > 0 && (
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </div>
                    {hasThumbnail && (
                      <div className="post-card-thumbnail hidden sm:block flex-shrink-0 p-4 pl-0">
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden">
                          <Image
                            src={post.thumbnail!}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 128px, 160px"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            </div>
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
