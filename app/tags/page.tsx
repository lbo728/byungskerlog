import { prisma } from "@/lib/prisma";
import { TagsPageClient } from "@/components/tags-page-client";

export const revalidate = 3600;

async function getAllTags() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { tags: true },
  });

  const tagCounts = new Map<string, number>();
  posts.forEach((post) => {
    if (post.tags) {
      post.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    }
  });

  const tags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return tags;
}

export default async function TagsPage() {
  const initialTags = await getAllTags();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Tags</h1>
        <TagsPageClient initialTags={initialTags} />
      </div>
    </div>
  );
}
