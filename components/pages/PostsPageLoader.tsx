import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { PostsPageClient } from "./PostsPageClient";

interface PostsPageLoaderProps {
  page: number;
}

const getPosts = (page: number) =>
  unstable_cache(
    async () => {
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
    },
    [`posts-page-${page}`],
    { revalidate: 3600, tags: ["posts"] }
  )();

export async function PostsPageLoader({ page }: PostsPageLoaderProps) {
  const data = await getPosts(page);

  return (
    <>
      <div className="posts-header flex items-baseline gap-3 mb-8">
        <h1 className="text-4xl font-bold">All Posts</h1>
        <span className="text-xl text-muted-foreground">{data.pagination.total}</span>
      </div>
      <PostsPageClient initialData={data} currentPage={page} />
    </>
  );
}
