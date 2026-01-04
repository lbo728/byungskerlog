import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PostDetail } from "@/components/post/PostDetail";
import {
  getPost,
  getSeriesPosts,
  getPrevNextPosts,
  getRelatedPosts,
} from "@/lib/post-data";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true, type: "SHORT" },
      select: { slug: true, subSlug: true },
    });

    const params: { slug: string }[] = [];

    posts.forEach((post: { slug: string; subSlug: string | null }) => {
      params.push({ slug: post.slug });
      if (post.subSlug) {
        params.push({ slug: post.subSlug });
      }
    });

    return params;
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const post = await prisma.post.findFirst({
    where: {
      OR: [{ slug: decodedSlug }, { subSlug: decodedSlug }],
    },
  });

  if (!post) {
    return {
      title: "포스트를 찾을 수 없습니다",
    };
  }

  const canonicalUrl = `${siteUrl}/short/${post.slug}`;
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
      url: canonicalUrl,
      siteName: "Byungsker Log",
      title: `${post.title} written by Byungsker`,
      description,
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: ["이병우 (Byungsker)"],
      tags: post.tags || [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} written by Byungsker`,
      description,
      creator: "@byungsker",
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ShortPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  if (post.type !== "SHORT") {
    notFound();
  }

  const seriesPosts = await getSeriesPosts(post.seriesId);
  const { prevPost, nextPost } = await getPrevNextPosts(
    post.createdAt,
    post.seriesId,
    post.slug,
    true
  );
  const relatedPosts = await getRelatedPosts(post.tags || [], post.slug, true);

  return (
    <PostDetail
      post={post}
      slug={slug}
      seriesPosts={seriesPosts}
      prevPost={prevPost}
      nextPost={nextPost}
      relatedPosts={relatedPosts}
      prevShortPost={null}
      nextShortPost={null}
      isFromShort={true}
    />
  );
}
