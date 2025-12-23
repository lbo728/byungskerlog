import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    // Find post by slug
    const post = await prisma.post.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get total views
    const totalViews = await prisma.postView.count({
      where: { postId: post.id },
    });

    // Get daily views
    const dailyViews = await prisma.postView.count({
      where: {
        postId: post.id,
        viewedAt: { gte: oneDayAgo },
      },
    });

    // Get weekly views
    const weeklyViews = await prisma.postView.count({
      where: {
        postId: post.id,
        viewedAt: { gte: oneWeekAgo },
      },
    });

    // Get monthly views
    const monthlyViews = await prisma.postView.count({
      where: {
        postId: post.id,
        viewedAt: { gte: oneMonthAgo },
      },
    });

    return NextResponse.json({
      total: totalViews,
      daily: dailyViews,
      weekly: weeklyViews,
      monthly: monthlyViews,
    });
  } catch (error) {
    console.error("Error fetching view stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
