import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { ShortPostsPageClient } from "./ShortPostsPageClient";

interface ShortPostsPageLoaderProps {
  page: number;
  countOnly?: boolean;
}

const getShortPosts = (page: number) =>
  unstable_cache(
    async () => {
      const limit = 20;
      const skip = (page - 1) * limit;

      try {
        const [postsRaw, total] = await Promise.all([
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
              tags: { select: { name: true } },
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

        const posts = postsRaw.map((p) => ({
          ...p,
          tags: p.tags.map((t) => t.name),
        }));

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

export async function ShortPostsPageLoader({ page, countOnly }: ShortPostsPageLoaderProps) {
  const data = await getShortPosts(page);

  if (countOnly) {
    return <span className="text-xl text-muted-foreground">{data.pagination.total}</span>;
  }

  return <ShortPostsPageClient initialData={data} currentPage={page} />;
}
