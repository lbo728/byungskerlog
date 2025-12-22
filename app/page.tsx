import { prisma } from "@/lib/prisma";
import { PostListClient } from "@/components/post-list-client";
import { AdSense } from "@/components/adsense";
import { Metadata } from "next";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://byungsker.com';
  const title = 'Byungsker Log';
  const description = '제품 주도 개발을 지향하는 개발자의 기술 블로그';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: baseUrl,
      siteName: 'Byungsker Log',
      locale: 'ko_KR',
      type: 'website',
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'Byungsker Log',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.png`],
    },
    alternates: {
      canonical: baseUrl,
    },
  };
}

async function getPosts() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return posts;
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
