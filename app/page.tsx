import { prisma } from "@/lib/prisma";
import { PostListClient } from "@/components/post-list-client";

export const revalidate = 3600;

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
      <PostListClient initialData={posts} />
    </div>
  );
}
