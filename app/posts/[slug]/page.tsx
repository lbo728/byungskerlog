import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { TableOfContents } from "@/components/toc";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ViewTracker } from "@/components/view-tracker";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Post } from "@/lib/types";

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { slug: true },
  });

  return posts.map((post: { slug: string }) => ({
    slug: post.slug,
  }));
}

async function getPost(slug: string): Promise<Post | null> {
  const post = await prisma.post.findUnique({
    where: { slug },
  });

  if (!post) return null;
  return post;
}

async function getPrevNextPosts(createdAt: Date) {
  const [prevPost, nextPost] = await Promise.all([
    // 이전 글 (더 오래된 글)
    prisma.post.findFirst({
      where: {
        published: true,
        createdAt: { lt: createdAt },
      },
      orderBy: { createdAt: "desc" },
      select: { slug: true, title: true },
    }),
    // 다음 글 (더 최신 글)
    prisma.post.findFirst({
      where: {
        published: true,
        createdAt: { gt: createdAt },
      },
      orderBy: { createdAt: "asc" },
      select: { slug: true, title: true },
    }),
  ]);

  return { prevPost, nextPost };
}

async function getRelatedPosts(tags: string[], currentSlug: string) {
  if (!tags || tags.length === 0) return [];

  const posts = await prisma.post.findMany({
    where: {
      published: true,
      slug: { not: currentSlug },
      tags: { hasSome: tags },
    },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      createdAt: true,
      tags: true,
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return posts;
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const { prevPost, nextPost } = await getPrevNextPosts(post.createdAt);
  const relatedPosts = await getRelatedPosts(post.tags || [], post.slug);

  return (
    <div className="bg-background">
      <ViewTracker slug={slug} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-12">
          <div className="max-w-3xl">
            <article>
              <header className="mb-8">
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-4 leading-tight">
                  {post.title}
                </h1>
                <div className="flex items-center gap-4">
                  <time className="text-muted-foreground text-sm" dateTime={post.createdAt.toISOString()}>
                    {format(new Date(post.createdAt), "MMMM d, yyyy")}
                  </time>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </header>

              <Separator className="my-8" />

              <MarkdownRenderer content={post.content} />
            </article>

            {/* 이전/다음 글 내비게이션 */}
            <Separator className="my-12" />
            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevPost ? (
                <Link href={`/posts/${prevPost.slug}`} className="group">
                  <Card className="h-full transition-colors hover:border-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        이전 글
                      </div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors">
                        {prevPost.title}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              ) : (
                <div />
              )}
              {nextPost ? (
                <Link href={`/posts/${nextPost.slug}`} className="group">
                  <Card className="h-full transition-colors hover:border-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-end text-sm text-muted-foreground mb-2">
                        다음 글
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </div>
                      <CardTitle className="text-base text-right group-hover:text-primary transition-colors">
                        {nextPost.title}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              ) : (
                <div />
              )}
            </nav>

            {/* 연관 글 */}
            {relatedPosts.length > 0 && (
              <>
                <Separator className="my-12" />
                <section>
                  <h2 className="text-2xl font-bold mb-6">연관 글</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {relatedPosts.map((relatedPost) => (
                      <Link key={relatedPost.slug} href={`/posts/${relatedPost.slug}`} className="group">
                        <Card className="transition-colors hover:border-primary">
                          <CardHeader>
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                              {relatedPost.title}
                            </CardTitle>
                            {relatedPost.excerpt && (
                              <CardDescription className="line-clamp-2">{relatedPost.excerpt}</CardDescription>
                            )}
                          </CardHeader>
                          {relatedPost.tags && relatedPost.tags.length > 0 && (
                            <CardContent className="pt-0">
                              <div className="flex flex-wrap gap-2">
                                {relatedPost.tags.map((tag) => (
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
                </section>
              </>
            )}
          </div>

          <aside className="hidden xl:block">
            <TableOfContents content={post.content} />
          </aside>
        </div>
      </div>
    </div>
  );
}
