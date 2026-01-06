"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { BookOpen, Clock, Flame, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { PostListSkeleton } from "@/components/skeleton/PostListSkeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { calculateReadingTime } from "@/lib/reading-time";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useHomePosts, usePopularPosts, type HomePost } from "@/hooks/usePosts";
import { useDeletePost } from "@/hooks/useDeletePost";

interface PostListClientProps {
  initialData: HomePost[];
}

type SortType = "latest" | "popular";

export function PostListClient({ initialData }: PostListClientProps) {
  const user = useUser();
  const router = useRouter();
  const [sortType, setSortType] = useState<SortType>("latest");

  const { data: latestPosts, isPending: isLatestPending } = useHomePosts({ initialData });
  const { data: popularPosts, isPending: isPopularPending } = usePopularPosts(sortType === "popular");

  const posts = sortType === "popular" ? popularPosts : latestPosts;
  const isPending = sortType === "popular" ? isPopularPending : isLatestPending;

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

  if (isPending) {
    return <PostListSkeleton />;
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-muted-foreground">아직 작성된 포스트가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="post-list-container">
      <nav className="post-list-tabs mb-8">
        <Tabs value={sortType} onValueChange={(value) => setSortType(value as SortType)}>
          <TabsList>
            <TabsTrigger value="latest" className="gap-1.5">
              <Clock className="h-4 w-4" />
              최신순
            </TabsTrigger>
            <TabsTrigger value="popular" className="gap-1.5">
              <Flame className="h-4 w-4" />
              인기순
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
        {posts.map((post: HomePost) => (
          <div key={post.id} className={`relative ${post.type !== "SHORT" ? "h-full" : ""}`}>
            <Link href={`/posts/${post.slug}`} className={`block group ${post.type !== "SHORT" ? "h-full" : ""}`}>
              <Card
                className={`flex flex-col overflow-hidden border-border/40 bg-card/50 hover:bg-card hover:shadow-md transition-all duration-300 group-hover:border-primary/50 py-0 pb-6 ${post.type !== "SHORT" ? "h-full" : "py-6"}`}
              >
                {post.type !== "SHORT" && (
                  <div className="thumbnail-container relative aspect-video overflow-hidden bg-muted">
                    {post.thumbnail ? (
                      <Image
                        src={post.thumbnail}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="default-thumbnail absolute inset-0 flex items-center justify-center bg-linear-to-br from-muted to-muted/50">
                        <Image
                          src="/logo-byungsker.png"
                          alt="Default thumbnail"
                          width={120}
                          height={56}
                          className="opacity-50"
                        />
                      </div>
                    )}
                  </div>
                )}
                <CardHeader>
                  <div className="card-meta flex flex-col gap-2 mb-3">
                    <div className="card-meta-row flex justify-between items-center">
                      <div className="card-type-badges flex gap-1.5">
                        {post.type === "SHORT" && (
                          <Badge
                            variant="secondary"
                            className="short-badge bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 border-0"
                          >
                            Short
                          </Badge>
                        )}
                        {post.series && (
                          <Badge
                            variant="secondary"
                            className="series-badge bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0"
                          >
                            <BookOpen className="h-3 w-3 mr-1" />
                            {post.series.name}
                          </Badge>
                        )}
                      </div>
                      <div className="card-date flex items-center gap-2 text-xs text-muted-foreground">
                        <time dateTime={new Date(post.createdAt).toISOString()}>
                          {format(new Date(post.createdAt), "yyyy.MM.dd")}
                        </time>
                        <span>·</span>
                        <span>{calculateReadingTime(post.content)}</span>
                      </div>
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="card-tag-badges flex gap-1.5 flex-wrap">
                        {post.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="font-normal">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold line-clamp-2 min-h-14 group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className={post.type !== "SHORT" ? "grow" : ""}>
                  <CardDescription className="line-clamp-3 text-base">{post.excerpt || ""}</CardDescription>
                </CardContent>
                <CardFooter
                  className={`pt-0 flex justify-between items-center ${post.type !== "SHORT" ? "mt-auto" : ""}`}
                >
                  <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Read more
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-arrow-right"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
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
                </CardFooter>
              </Card>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
