import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api";

async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.post.findFirst({
      where: {
        OR: [{ slug }, { subSlug: slug }],
      },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const body = await request.json();
    const { title, slug: requestedSlug, excerpt, content, tags, published, thumbnail, seriesId, type } = body;

    if (!title || !requestedSlug || !content) {
      throw ApiError.validationError("Missing required fields", {
        required: ["title", "slug", "content"],
      });
    }

    const slug = await generateUniqueSlug(requestedSlug);

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt: excerpt || null,
        content,
        tags: tags || [],
        type: type || "LONG",
        published: published ?? false,
        thumbnail: thumbnail || null,
        seriesId: seriesId || null,
      },
    });

    revalidatePath("/");
    revalidatePath("/posts");
    revalidatePath("/short-posts");
    revalidatePath("/tags");
    revalidatePath(`/posts/${slug}`);

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return ApiError.duplicateEntry("post with this slug").toResponse();
    }
    return handleApiError(error, "Failed to create post");
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const tag = searchParams.get("tag");
    const includeUnpublished = searchParams.get("includeUnpublished") === "true";
    const sortBy = searchParams.get("sortBy") || "desc";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");

    const skip = (page - 1) * limit;

    type WhereClause = {
      published?: boolean;
      tags?: { has: string };
      type?: "LONG" | "SHORT";
      createdAt?: {
        gte?: Date;
        lt?: Date;
      };
    };

    const where: WhereClause = {};

    if (!includeUnpublished) {
      where.published = true;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (type && (type === "LONG" || type === "SHORT")) {
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

    const total = await prisma.post.count({ where });

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: sortBy === "asc" ? "asc" : "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        subSlug: true,
        title: true,
        excerpt: true,
        content: true,
        thumbnail: true,
        tags: true,
        type: true,
        published: true,
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

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const postIds = posts.map((post) => post.id);

    const allViews =
      postIds.length > 0
        ? await prisma.postView.findMany({
            where: { postId: { in: postIds } },
            select: {
              postId: true,
              viewedAt: true,
            },
          })
        : [];

    const viewStats = allViews.reduce(
      (acc, view) => {
        if (!acc[view.postId]) {
          acc[view.postId] = { totalViews: 0, dailyViews: 0 };
        }
        acc[view.postId].totalViews++;
        if (view.viewedAt >= oneDayAgo) {
          acc[view.postId].dailyViews++;
        }
        return acc;
      },
      {} as Record<string, { totalViews: number; dailyViews: number }>
    );

    const postsWithViews = posts.map((post) => ({
      ...post,
      totalViews: viewStats[post.id]?.totalViews || 0,
      dailyViews: viewStats[post.id]?.dailyViews || 0,
    }));

    const sortedPosts =
      sortBy === "popular"
        ? postsWithViews.sort((a, b) => b.totalViews - a.totalViews)
        : postsWithViews;

    return NextResponse.json({
      posts: sortedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch posts");
  }
}
