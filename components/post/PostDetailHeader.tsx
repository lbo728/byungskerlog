import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/Separator";
import { cn } from "@/lib/utils";
import { PostActions } from "./PostActions";
import { ReadingProgress } from "./ReadingProgress";
import { MobileToc } from "./MobileToc";
import { ViewTracker } from "@/components/analytics/ViewTracker";
import { ReadingTracker } from "@/components/analytics/ReadingTracker";
import { AdSense } from "@/components/seo/Adsense";
import { StructuredData } from "@/components/seo/StructuredData";
import { SocialMediaLinks } from "./SocialMediaLinks";
import { ArrowLeft, BookOpen } from "lucide-react";
import { calculateReadingTime } from "@/lib/reading-time";
import type { PostHeader } from "@/lib/post-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

interface PostDetailHeaderProps {
  post: PostHeader;
  slug: string;
  isFromShort: boolean;
}

export function PostDetailHeader({ post, slug, isFromShort }: PostDetailHeaderProps) {
  const basePath = isFromShort ? "/short" : "/posts";
  const backLink = isFromShort ? "/short-posts" : "/posts";
  const backLabel = isFromShort ? "Short" : "Post";

  return (
    <div className="bg-background">
      <ReadingProgress />
      {post.type !== "SHORT" && <MobileToc content={post.content} />}
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
      <ReadingTracker slug={slug} postType={post.type} />
      <div className="post-detail-layout relative py-12">
        <div className="post-content-center flex justify-center px-4 sm:px-6 lg:px-8">
          <div className={cn("post-main-content max-w-5xl w-full", post.type !== "SHORT" && "xl:pr-24")}>
            <AdSense adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_POST_TOP || ""} className="mb-8" />

            <Link
              href={backLink}
              className="back-to-posts inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>

            <article>
              <header className="mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
                  {post.title}
                </h1>
                <div className="post-header-meta flex gap-4 flex-col">
                  <div className="post-dates flex flex-col gap-1 text-muted-foreground text-sm">
                    <div className="post-created flex items-center gap-2 flex-wrap">
                      <span>작성:</span>
                      <time dateTime={post.createdAt.toISOString()}>
                        {format(new Date(post.createdAt), "MMMM d, yyyy 'at' HH:mm")}
                      </time>
                      <span className="hidden sm:inline">·</span>
                      <span>{calculateReadingTime(post.content)}</span>
                    </div>
                    <div className="post-updated flex items-center gap-2">
                      <span>최종 수정:</span>
                      <time dateTime={post.updatedAt.toISOString()}>
                        {format(new Date(post.updatedAt), "MMMM d, yyyy 'at' HH:mm")}
                      </time>
                    </div>
                  </div>
                  <PostActions
                    postId={post.id}
                    postTitle={post.title}
                    postSlug={post.slug}
                    postSubSlug={post.subSlug}
                  />
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
                  {post.type === "SHORT" &&
                    (post.linkedinUrl ||
                      post.threadsUrl ||
                      post.linkedinContent ||
                      (post.threadsContent && post.threadsContent.length > 0)) && (
                      <SocialMediaLinks
                        linkedinUrl={post.linkedinUrl}
                        threadsUrl={post.threadsUrl}
                        postId={post.id}
                        linkedinContent={post.linkedinContent}
                        threadsContent={post.threadsContent}
                      />
                    )}
                </div>
              </header>

              <Separator className="my-8" />

              {post.thumbnail && !post.thumbnail.includes("og-image") && (
                <div className="post-thumbnail relative w-full aspect-video mb-8 rounded-lg overflow-hidden">
                  <Image
                    src={post.thumbnail}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
                  />
                </div>
              )}
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
