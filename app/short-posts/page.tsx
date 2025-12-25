import { prisma } from "@/lib/prisma";
import { ShortPostsPageClient } from "@/components/short-posts-page-client";
import type { Metadata } from "next";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export const metadata: Metadata = {
  title: "Short Posts | Byungsker Log",
  description: "링크드인 스타일의 짧은 생각과 인사이트를 공유합니다. 개발, 제품, 스타트업에 대한 간결한 이야기들.",
  alternates: {
    canonical: `${siteUrl}/short-posts`,
  },
  openGraph: {
    title: "Short Posts | Byungsker Log",
    description: "링크드인 스타일의 짧은 생각과 인사이트를 공유합니다.",
    url: `${siteUrl}/short-posts`,
  },
};

interface ShortPostsPageProps {
  searchParams: Promise<{ page?: string }>;
}

async function getShortPosts(page: number) {
  const limit = 20;
  const skip = (page - 1) * limit;

  try {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { published: true, type: "SHORT" },
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
          series: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.post.count({ where: { published: true, type: "SHORT" } }),
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
  } catch {
    return {
      posts: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }
}

export default async function ShortPostsPage({ searchParams }: ShortPostsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const data = await getShortPosts(page);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="short-posts-header flex items-baseline gap-3 mb-8">
          <h1 className="text-4xl font-bold">Short Posts</h1>
          <span className="text-xl text-muted-foreground">{data.pagination.total}</span>
        </div>
        <ShortPostsPageClient initialData={data} currentPage={page} />
      </div>
    </div>
  );
}
