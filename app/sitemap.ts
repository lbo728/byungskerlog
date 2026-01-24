import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 정적 페이지 URL
  const staticPages = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${siteUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${siteUrl}/short-posts`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${siteUrl}/series`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${siteUrl}/tags`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  try {
    // 게시된 Long 포스트 가져오기
    const longPosts = await prisma.post.findMany({
      where: { published: true, type: "LONG" },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Long 포스트 URL 생성
    const longPostUrls = longPosts.map((post) => ({
      url: `${siteUrl}/posts/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // 게시된 Short 포스트 가져오기
    const shortPosts = await prisma.post.findMany({
      where: { published: true, type: "SHORT" },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Short 포스트 URL 생성
    const shortPostUrls = shortPosts.map((post) => ({
      url: `${siteUrl}/short/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // 시리즈 가져오기
    const seriesList = await prisma.series.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // 시리즈 URL 생성
    const seriesUrls = seriesList.map((series) => ({
      url: `${siteUrl}/series/${series.slug}`,
      lastModified: series.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...longPostUrls, ...shortPostUrls, ...seriesUrls];
  } catch {
    return staticPages;
  }
}
