import { prisma } from "@/lib/prisma";
import { PostsPageClient } from "@/components/posts-page-client";

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
  const data = await getPosts(page);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">All Posts</h1>
        <PostsPageClient initialData={data} currentPage={page} />
      </div>
    </div>
  );
}
