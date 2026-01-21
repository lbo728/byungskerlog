import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { ShortPostsPageClient } from "./ShortPostsPageClient";

interface ShortPostsPageLoaderProps {
  page: number;
}

const getShortPosts = (page: number) =>
  unstable_cache(
    async () => {
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
    },
    [`short-posts-page-${page}`],
    { revalidate: 3600, tags: ["posts", "short-posts"] }
  )();

export async function ShortPostsPageLoader({ page }: ShortPostsPageLoaderProps) {
  const data = await getShortPosts(page);

  return <ShortPostsPageClient initialData={data} currentPage={page} />;
}
