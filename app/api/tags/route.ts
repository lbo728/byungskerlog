import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            posts: {
              where: { published: true },
            },
          },
        },
      },
      orderBy: {
        posts: {
          _count: "desc",
        },
      },
    });

    const result = tags
      .filter((t) => t._count.posts > 0)
      .map((t) => ({
        tag: t.name,
        count: t._count.posts,
        id: t.id,
        slug: t.slug,
      }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}
