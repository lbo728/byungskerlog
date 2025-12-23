import { prisma } from "@/lib/prisma";
import { PostListClient } from "@/components/post-list-client";
import { AdSense } from "@/components/adsense";
import type { Metadata } from "next";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export const metadata: Metadata = {
  description: "제품 주도 개발을 지향하는 개발자, 이병우의 기술 블로그. 최신 소프트웨어 개발, 제품 개발, 스타트업 관련 글을 확인하세요.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    url: siteUrl,
  },
};

async function getPosts() {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        thumbnail: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        series: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
    return posts;
  } catch {
    return [];
  }
}

export default async function Home() {
  const posts = await getPosts();

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Ad */}
      <AdSense
        adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP || ''}
        className="mb-8"
      />

      <PostListClient initialData={posts} />

      {/* Bottom Ad */}
      <AdSense
        adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_BOTTOM || ''}
        className="mt-8"
      />
    </div>
  );
}
