import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { TableOfContents } from "@/components/toc";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ViewTracker } from "@/components/view-tracker";
import { PostActions } from "@/components/post-actions";
import { ReadingProgress } from "@/components/reading-progress";
import { AdSense } from "@/components/adsense";
import { Comments } from "@/components/comments";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { calculateReadingTime } from "@/lib/reading-time";
import type { Metadata } from "next";
import { StructuredData } from "@/components/structured-data";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: { slug: true },
    });

    return posts.map((post: { slug: string }) => ({
      slug: post.slug,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug },
  });

  if (!post) {
    return {
      title: "포스트를 찾을 수 없습니다",
    };
  }

  const postUrl = `${siteUrl}/posts/${slug}`;
  const imageUrl = post.thumbnail || `${siteUrl}/og-image.png`;

  // 본문에서 첫 200자를 추출하여 description으로 사용
  const description = post.excerpt || post.content.replace(/[#*`\n]/g, "").substring(0, 200) + "...";

  return {
    title: `${post.title} written by Byungsker`,
    description,
    keywords: post.tags || [],
    authors: [{ name: "이병우 (Byungsker)" }],
    openGraph: {
      type: "article",
      locale: "ko_KR",
      alternateLocale: ["en_US"],
      url: postUrl,
      siteName: "Byungsker Log",
      title: `${post.title} written by Byungsker`,
      description,
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: ["이병우 (Byungsker)"],
      tags: post.tags || [],
      images: [
        {
          url: imageUrl,
          width: post.thumbnail ? undefined : 1200,
          height: post.thumbnail ? undefined : 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} written by Byungsker`,
      description,
      images: [imageUrl],
      creator: "@byungsker",
    },
    alternates: {
      canonical: postUrl,
    },
  };
}

async function getPost(slug: string) {
  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      series: true,
    },
  });

  if (!post) return null;
  return post;
}

async function getSeriesPosts(seriesId: string | null) {
  if (!seriesId) return [];

  const posts = await prisma.post.findMany({
    where: {
      published: true,
      seriesId,
    },
    orderBy: { createdAt: "asc" },
    select: { slug: true, title: true, createdAt: true },
  });

  return posts;
}

async function getPrevNextPosts(createdAt: Date, seriesId: string | null, currentSlug: string) {
  if (seriesId) {
    const seriesPosts = await prisma.post.findMany({
      where: { published: true, seriesId },
      orderBy: { createdAt: "asc" },
      select: { slug: true, title: true, createdAt: true },
    });

    const currentIndex = seriesPosts.findIndex((p) => p.slug === currentSlug);

    let prevPost = null;
    let nextPost = null;

    if (currentIndex > 0) {
      prevPost = seriesPosts[currentIndex - 1];
    } else {
      prevPost = await prisma.post.findFirst({
        where: { published: true, createdAt: { lt: createdAt } },
        orderBy: { createdAt: "desc" },
        select: { slug: true, title: true },
      });
    }

    if (currentIndex < seriesPosts.length - 1) {
      nextPost = seriesPosts[currentIndex + 1];
    } else {
      nextPost = await prisma.post.findFirst({
        where: { published: true, createdAt: { gt: createdAt } },
        orderBy: { createdAt: "asc" },
        select: { slug: true, title: true },
      });
    }

    return { prevPost, nextPost };
  }

  const [prevPost, nextPost] = await Promise.all([
    prisma.post.findFirst({
      where: { published: true, createdAt: { lt: createdAt } },
      orderBy: { createdAt: "desc" },
      select: { slug: true, title: true },
    }),
    prisma.post.findFirst({
      where: { published: true, createdAt: { gt: createdAt } },
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

  const seriesPosts = await getSeriesPosts(post.seriesId);
  const { prevPost, nextPost } = await getPrevNextPosts(post.createdAt, post.seriesId, post.slug);
  const relatedPosts = await getRelatedPosts(post.tags || [], post.slug);
  const currentSeriesIndex = seriesPosts.findIndex((p) => p.slug === post.slug);

  return (
    <div className="bg-background">
      <ReadingProgress />
      <StructuredData
        type="article"
        data={{
          title: `${post.title} written by Byungsker`,
          description: post.excerpt || post.content.replace(/[#*`\n]/g, "").substring(0, 200) + "...",
          image: post.thumbnail || `${siteUrl}/og-image.png`,
          slug: post.slug,
          datePublished: post.createdAt.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          tags: post.tags || [],
        }}
      />
      <ViewTracker slug={slug} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-12">
          <div className="max-w-3xl">
            {/* Top Ad */}
            <AdSense adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_POST_TOP || ""} className="mb-8" />

            <article>
              <header className="mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
                  {post.title}
                </h1>
                <div className="flex gap-4 flex-col">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1 text-muted-foreground text-sm">
                      <div className="flex items-center gap-2">
                        <span>작성:</span>
                        <time dateTime={post.createdAt.toISOString()}>
                          {format(new Date(post.createdAt), "MMMM d, yyyy")}
                        </time>
                        <span>·</span>
                        <span>{calculateReadingTime(post.content)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>최종 수정:</span>
                        <time dateTime={post.updatedAt.toISOString()}>
                          {format(new Date(post.updatedAt), "MMMM d, yyyy")}
                        </time>
                      </div>
                    </div>
                    <PostActions postId={post.id} postTitle={post.title} />
                  </div>
                  {post.series && (
                    <div className="series-badge flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm text-emerald-500 font-medium">{post.series.name}</span>
                    </div>
                  )}
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

            {/* Middle Ad */}
            <AdSense adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_POST_MIDDLE || ""} className="my-8" />

            {/* 시리즈 섹션 */}
            {post.series && seriesPosts.length > 0 && (
              <>
                <Separator className="my-12" />
                <section className="series-section">
                  <div className="series-header flex items-center gap-2 mb-4">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">{post.series.name}</h2>
                    <span className="text-sm text-muted-foreground">
                      ({currentSeriesIndex + 1}/{seriesPosts.length})
                    </span>
                  </div>
                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <ul className="series-list space-y-2">
                        {seriesPosts.map((seriesPost, index) => (
                          <li key={seriesPost.slug}>
                            <Link
                              href={`/posts/${seriesPost.slug}`}
                              className={`series-item flex items-center gap-3 py-2 px-3 rounded-md transition-colors ${
                                seriesPost.slug === post.slug
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "hover:bg-muted"
                              }`}
                            >
                              <span className="series-index text-sm text-muted-foreground w-6">{index + 1}.</span>
                              <span className="series-title line-clamp-1">{seriesPost.title}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </section>
              </>
            )}

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

            {/* 댓글 */}
            <Separator className="my-12" />
            <Comments slug={slug} />

            {/* Bottom Ad */}
            <AdSense adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_POST_BOTTOM || ""} className="mt-12" />
          </div>

          <aside className="hidden xl:block">
            <TableOfContents content={post.content} />
          </aside>
        </div>
      </div>
    </div>
  );
}
