import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { PostListClient } from "./PostListClient";

const getPosts = unstable_cache(
  async () => {
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
          type: true,
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
  },
  ["home-posts"],
  { revalidate: 3600, tags: ["posts"] }
);

export async function PostListLoader() {
  const posts = await getPosts();
  return <PostListClient initialData={posts} />;
}
