import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { PostsPageClient } from "./PostsPageClient";

interface PostsPageLoaderProps {
  page: number;
  countOnly?: boolean;
}

const getPosts = (page: number) =>
  unstable_cache(
    async () => {
      const limit = 20;
      const skip = (page - 1) * limit;

      try {
        const [postsRaw, total] = await Promise.all([
          prisma.post.findMany({
            where: { published: true, type: "LONG" },
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
          prisma.post.count({ where: { published: true, type: "LONG" } }),
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
    [`posts-page-${page}`],
    { revalidate: 3600, tags: ["posts"] }
  )();

export async function PostsPageLoader({ page, countOnly }: PostsPageLoaderProps) {
  const data = await getPosts(page);

  if (countOnly) {
    return <span className="text-xl text-muted-foreground">{data.pagination.total}</span>;
  }

  return <PostsPageClient initialData={data} currentPage={page} />;
}
