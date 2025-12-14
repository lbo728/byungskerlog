import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get unique visitors today (based on IP address)
    const todayViews = await prisma.postView.findMany({
      where: {
        viewedAt: { gte: startOfToday },
      },
      select: {
        ipAddress: true,
      },
    });

    const uniqueToday = new Set(todayViews.map(v => v.ipAddress).filter(Boolean)).size;

    // Get total unique visitors (based on IP address)
    const allViews = await prisma.postView.findMany({
      select: {
        ipAddress: true,
      },
    });

    const uniqueTotal = new Set(allViews.map(v => v.ipAddress).filter(Boolean)).size;

    return NextResponse.json({
      today: uniqueToday,
      total: uniqueTotal,
    });
  } catch (error) {
    console.error("Error fetching visitor stats:", error);
    return NextResponse.json({ error: "Failed to fetch visitor stats" }, { status: 500 });
  }
}
