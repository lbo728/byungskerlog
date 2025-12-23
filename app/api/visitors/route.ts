import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    // Check authentication
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    // Use UTC for consistent timezone handling
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Use database aggregation for better performance
    const uniqueToday = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT "ipAddress") as count
      FROM "PostView"
      WHERE "ipAddress" IS NOT NULL
      AND "viewedAt" >= ${startOfToday}
    `;

    const uniqueTotal = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT "ipAddress") as count
      FROM "PostView"
      WHERE "ipAddress" IS NOT NULL
    `;

    return NextResponse.json(
      {
        today: Number(uniqueToday[0].count),
        total: Number(uniqueTotal[0].count),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching visitor stats:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.name, error.message);
    }
    return NextResponse.json({ error: "Failed to fetch visitor stats" }, { status: 500 });
  }
}
