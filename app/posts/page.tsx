import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { calculateReadingTime } from "@/lib/reading-time";

export const revalidate = 3600;

interface PostsPageProps {
  searchParams: Promise<{ page?: string }>;
}

async function getPosts(page: number) {
  const limit = 20;
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        tags: true,
        createdAt: true,
      },
    }),
    prisma.post.count({ where: { published: true } }),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const { posts, pagination } = await getPosts(page);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">All Posts</h1>

        <div className="grid gap-6">
          {posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.slug}`} className="group">
              <Card className="transition-colors hover:border-primary">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                    <time dateTime={post.createdAt.toISOString()}>
                      {format(new Date(post.createdAt), "MMMM d, yyyy")}
                    </time>
                    <span>·</span>
                    <span>{calculateReadingTime(post.content)}</span>
                  </div>
                  <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                  {post.excerpt && (
                    <CardDescription className="line-clamp-2 text-base">{post.excerpt}</CardDescription>
                  )}
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
              </Card>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={page === 1}
              className={page === 1 ? "pointer-events-none opacity-50" : ""}
            >
              <Link href={`/posts?page=${page - 1}`}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Link>
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  asChild
                >
                  <Link href={`/posts?page=${pageNum}`}>{pageNum}</Link>
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={page === pagination.totalPages}
              className={page === pagination.totalPages ? "pointer-events-none opacity-50" : ""}
            >
              <Link href={`/posts?page=${page + 1}`}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
