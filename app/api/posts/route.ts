import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";

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
    // Check authentication with Stack Auth
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, slug: requestedSlug, excerpt, content, tags, published, thumbnail, seriesId } = body;

    // Validate required fields
    if (!title || !requestedSlug || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate unique slug (add suffix if duplicate)
    const slug = await generateUniqueSlug(requestedSlug);

    // Create post
    const post = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt: excerpt || null,
        content,
        tags: tags || [],
        published: published ?? false,
        thumbnail: thumbnail || null,
        seriesId: seriesId || null,
      },
    });

    // On-demand revalidation
    revalidatePath("/");
    revalidatePath("/posts");
    revalidatePath("/tags");
    revalidatePath(`/posts/${slug}`);

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);

    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const tag = searchParams.get("tag");
    const includeUnpublished = searchParams.get("includeUnpublished") === "true";
    const sortBy = searchParams.get("sortBy") || "desc"; // "desc", "asc", or "popular"
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    type WhereClause = {
      published?: boolean;
      tags?: { has: string };
      createdAt?: {
        gte?: Date;
        lt?: Date;
      };
    };

    const where: WhereClause = {};

    // Only filter by published if not including unpublished (admin mode)
    if (!includeUnpublished) {
      where.published = true;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    // Add date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to include the end date
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.createdAt.lt = end;
      }
    }

    // Get total count for pagination
    const total = await prisma.post.count({ where });

    // Get posts with pagination
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

    // Calculate view stats for all posts efficiently (avoid N+1 queries)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const postIds = posts.map((post) => post.id);

    // Get all views for these posts in a single query
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

    // Group views by postId and calculate total/daily counts
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

    // Attach view stats to posts
    const postsWithViews = posts.map((post) => ({
      ...post,
      totalViews: viewStats[post.id]?.totalViews || 0,
      dailyViews: viewStats[post.id]?.dailyViews || 0,
    }));

    // Sort by popularity if requested
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
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
