import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";

type StatType = "category" | "views" | "count" | "reading";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const statType = searchParams.get("statType") as StatType | null;

    if (!statType || !["category", "views", "count", "reading"].includes(statType)) {
      throw ApiError.validationError("Invalid statType. Must be 'category', 'views', 'count', or 'reading'");
    }

    type WhereClause = {
      published?: boolean;
      type?: "LONG" | "SHORT";
      createdAt?: {
        gte?: Date;
        lt?: Date;
      };
    };

    const where: WhereClause = { published: true };

    if (type && type !== "all" && (type === "LONG" || type === "SHORT")) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.createdAt.lt = end;
      }
    }

    let data;

    switch (statType) {
      case "category":
        data = await getCategoryStats(where);
        break;
      case "views":
        data = await getViewsStats(where);
        break;
      case "count":
        data = await getCountStats(where);
        break;
      case "reading":
        data = await getReadingStats(where);
        break;
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, "Failed to fetch analytics");
  }
}

async function getCategoryStats(where: {
  published?: boolean;
  type?: "LONG" | "SHORT";
  createdAt?: { gte?: Date; lt?: Date };
}) {
  const posts = await prisma.post.findMany({
    where,
    select: { tags: true },
  });

  const tagCounts: Record<string, number> = {};
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

async function getViewsStats(where: {
  published?: boolean;
  type?: "LONG" | "SHORT";
  createdAt?: { gte?: Date; lt?: Date };
}) {
  const posts = await prisma.post.findMany({
    where,
    select: { id: true, title: true, slug: true },
  });

  const postIds = posts.map((p) => p.id);

  if (postIds.length === 0) {
    return [];
  }

  const views = await prisma.postView.groupBy({
    by: ["postId"],
    where: { postId: { in: postIds } },
    _count: { postId: true },
  });

  const viewMap = new Map(views.map((v) => [v.postId, v._count.postId]));

  return posts
    .map((post) => ({
      title: post.title.length > 30 ? post.title.slice(0, 30) + "..." : post.title,
      slug: post.slug,
      views: viewMap.get(post.id) || 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
}

async function getCountStats(where: {
  published?: boolean;
  type?: "LONG" | "SHORT";
  createdAt?: { gte?: Date; lt?: Date };
}) {
  const posts = await prisma.post.findMany({
    where,
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const dateCounts: Record<string, number> = {};
  posts.forEach((post) => {
    const dateKey = post.createdAt.toISOString().split("T")[0];
    dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
  });

  return Object.entries(dateCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function getReadingStats(where: {
  published?: boolean;
  type?: "LONG" | "SHORT";
  createdAt?: { gte?: Date; lt?: Date };
}) {
  const longWhere = { ...where, type: "LONG" as const };

  const posts = await prisma.post.findMany({
    where: longWhere,
    select: { id: true, title: true, slug: true },
  });

  const postIds = posts.map((p) => p.id);

  if (postIds.length === 0) {
    return [];
  }

  const sessions = await prisma.readingSession.groupBy({
    by: ["postId"],
    where: { postId: { in: postIds } },
    _count: { id: true },
    _avg: { maxScrollDepth: true },
  });

  const completedCounts = await prisma.readingSession.groupBy({
    by: ["postId"],
    where: {
      postId: { in: postIds },
      completed: true,
    },
    _count: { id: true },
  });

  const sessionMap = new Map<string, { total: number; avgDepth: number }>(
    sessions.map((s) => [s.postId, { total: s._count.id, avgDepth: s._avg.maxScrollDepth || 0 }])
  );

  const completedMap = new Map<string, number>(completedCounts.map((c) => [c.postId, c._count.id]));

  return posts
    .map((post) => {
      const stats = sessionMap.get(post.id) || { total: 0, avgDepth: 0 };
      const completed = completedMap.get(post.id) || 0;
      const completionRate = stats.total > 0 ? (completed / stats.total) * 100 : 0;

      return {
        title: post.title.length > 25 ? post.title.slice(0, 25) + "..." : post.title,
        slug: post.slug,
        sessions: stats.total,
        avgDepth: Math.round(stats.avgDepth),
        completionRate: Math.round(completionRate),
      };
    })
    .filter((p) => p.sessions > 0)
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);
}
