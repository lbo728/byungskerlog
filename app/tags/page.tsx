import { prisma } from "@/lib/prisma";
import { TagsPageClient } from "@/components/pages";
import type { Metadata } from "next";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export const metadata: Metadata = {
  title: "Tags | Byungsker Log",
  description:
    "주제별로 정리된 포스트를 태그로 찾아보세요. 소프트웨어 개발, 제품 개발, 스타트업 등 다양한 주제의 글을 탐색할 수 있습니다.",
  alternates: {
    canonical: `${siteUrl}/tags`,
  },
  openGraph: {
    title: "Tags | Byungsker Log",
    description: "주제별로 정리된 포스트를 태그로 찾아보세요.",
    url: `${siteUrl}/tags`,
  },
};

async function getAllTags() {
  try {
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
  } catch {
    return [];
  }
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
