import { prisma } from "@/lib/prisma";
import { PostsPageClient } from "@/components/pages/posts-page-client";
import type { Metadata } from "next";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export const metadata: Metadata = {
  title: "Posts | Byungsker Log",
  description:
    "소프트웨어 개발, 제품 개발, 스타트업에 대한 모든 포스트를 확인하세요. 제품 주도 개발을 지향하는 개발자의 인사이트를 공유합니다.",
  alternates: {
    canonical: `${siteUrl}/posts`,
  },
  openGraph: {
    title: "Posts | Byungsker Log",
    description: "소프트웨어 개발, 제품 개발, 스타트업에 대한 모든 포스트를 확인하세요.",
    url: `${siteUrl}/posts`,
  },
};

interface PostsPageProps {
  searchParams: Promise<{ page?: string }>;
}

async function getPosts(page: number) {
  const limit = 20;
  const skip = (page - 1) * limit;

  try {
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
          thumbnail: true,
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

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const data = await getPosts(page);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="posts-header flex items-baseline gap-3 mb-8">
          <h1 className="text-4xl font-bold">All Posts</h1>
          <span className="text-xl text-muted-foreground">{data.pagination.total}</span>
        </div>
        <PostsPageClient initialData={data} currentPage={page} />
      </div>
    </div>
  );
}
