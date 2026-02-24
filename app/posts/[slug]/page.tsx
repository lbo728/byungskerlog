import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { PostDetailLoader } from "@/components/post/PostDetailLoader";
import { PostDetailSkeleton } from "@/components/skeleton/PostDetailSkeleton";
import { StructuredData } from "@/components/seo/StructuredData";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
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
  const postData = await prisma.post.findFirst({
    where: {
      published: true,
      OR: [{ slug: decodedSlug }, { subSlug: decodedSlug }],
    },
    include: {
      tags: { select: { name: true } },
    },
  });

  if (!postData) {
    return {
      title: "포스트를 찾을 수 없습니다",
    };
  }

  const post = { ...postData, tags: postData.tags.map((t) => t.name) };
  const canonicalUrl = `${siteUrl}/posts/${post.slug}`;
  const ogImageUrl = `${siteUrl}/posts/${encodeURIComponent(post.slug)}/opengraph-image`;
  const description = post.excerpt || post.content.replace(/[#*`\n]/g, "").substring(0, 200) + "...";

  return {
    title: post.title,
    description,
    keywords: post.tags,
    authors: [{ name: "병스커 (Byungsker)" }],
    openGraph: {
      type: "article",
      locale: "ko_KR",
      alternateLocale: ["en_US"],
      url: canonicalUrl,
      siteName: "Byungsker Log",
      title: post.title,
      description,
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: ["병스커 (Byungsker)"],
      tags: post.tags || [],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [ogImageUrl],
      creator: "@byungsker",
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const postData = await prisma.post.findFirst({
    where: {
      published: true,
      OR: [{ slug: decodedSlug }, { subSlug: decodedSlug }],
    },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      tags: { select: { name: true } },
    },
  });

  const seoData = postData
    ? {
        title: postData.title,
        description:
          postData.excerpt || postData.content.replace(/[#*`\n]/g, "").substring(0, 200) + "...",
        image: `${siteUrl}/posts/${encodeURIComponent(postData.slug)}/opengraph-image`,
        slug: postData.slug,
        datePublished: postData.createdAt.toISOString(),
        dateModified: postData.updatedAt.toISOString(),
        tags: postData.tags.map((t) => t.name),
      }
    : undefined;
  return (
    <>
      {seoData && <StructuredData type="article" data={seoData} />}
      <Suspense fallback={<PostDetailSkeleton />}>
        <PostDetailLoader slug={slug} isFromShort={false} />
      </Suspense>
    </>
  );
}
