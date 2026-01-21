"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { BookOpen, Clock, Flame, LayoutGrid, List, Pencil, Trash2 } from "lucide-react";
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
type ViewMode = "card" | "list";

const VIEW_MODE_KEY = "home-view-mode";

export function PostListClient({ initialData }: PostListClientProps) {
  const user = useUser();
  const router = useRouter();
  const [sortType, setSortType] = useState<SortType>("latest");
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    if (saved === "card" || saved === "list") {
      setViewMode(saved);
    }
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  };

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

  if (!posts || posts.length === 0) {
    if (isPending) {
      return <PostListSkeleton />;
    }
    return (
      <div className="text-center py-20">
        <p className="text-xl text-muted-foreground">아직 작성된 포스트가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="post-list-container">
      <nav className="post-list-tabs flex items-center justify-between mb-8">
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
        <div className="view-mode-toggle flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === "card" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => handleViewModeChange("card")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => handleViewModeChange("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      {viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {posts.map((post: HomePost) => (
            <div key={post.id} className={`relative ${post.type !== "SHORT" ? "h-full" : ""}`}>
              <Link
                href={post.type === "SHORT" ? `/short/${post.slug}` : `/posts/${post.slug}`}
                className={`block group ${post.type !== "SHORT" ? "h-full" : ""}`}
              >
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
      ) : (
        <div className="post-list-view divide-y divide-border">
          {posts.map((post: HomePost) => {
            const hasThumbnail = post.thumbnail && !post.thumbnail.includes("og-image") && post.type !== "SHORT";
            const postUrl = post.type === "SHORT" ? `/short/${post.slug}` : `/posts/${post.slug}`;

            return (
              <article key={post.id} className="post-item relative">
                <Link href={postUrl} className="group block py-6">
                  <div className="post-item-inner flex gap-4 sm:gap-6">
                    <div className="post-item-content flex-1 min-w-0 flex flex-col">
                      <div className="post-item-badges flex gap-1.5 mb-2">
                        {post.type === "SHORT" && (
                          <Badge
                            variant="secondary"
                            className="short-badge bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 border-0 text-xs"
                          >
                            Short
                          </Badge>
                        )}
                        {post.series && (
                          <Badge
                            variant="secondary"
                            className="series-badge bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0 text-xs"
                          >
                            <BookOpen className="h-3 w-3 mr-1" />
                            {post.series.name}
                          </Badge>
                        )}
                      </div>
                      <h2 className="post-item-title text-lg sm:text-xl font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="post-item-excerpt hidden sm:block mt-2 text-muted-foreground text-sm line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="post-item-meta flex items-center gap-2 mt-3 text-xs sm:text-sm text-muted-foreground">
                        <time dateTime={new Date(post.createdAt).toISOString()}>
                          {format(new Date(post.createdAt), "MMM d, yyyy")}
                        </time>
                        <span>·</span>
                        <span>{calculateReadingTime(post.content)}</span>
                      </div>
                      <div className="post-item-tags-row flex items-center gap-1.5 mt-3">
                        {post.tags && post.tags.length > 0 && (
                          <div className="post-item-tags flex flex-wrap gap-1.5">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                                {tag}
                              </span>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{post.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                        {user && (
                          <div className="post-item-actions flex items-center gap-1 ml-auto">
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
                    </div>
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
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
