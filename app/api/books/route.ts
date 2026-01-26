import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api/errors";

export async function GET() {
  try {
    const books = await prisma.book.findMany({
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { readAt: "desc" },
    });

    return NextResponse.json(books);
  } catch (error) {
    return handleApiError(error, "Failed to fetch books");
  }
}
