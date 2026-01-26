import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api/errors";
import { getAuthUser } from "@/lib/auth";

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

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let baseSlug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.book.findUnique({ where: { slug } })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const book = await prisma.book.create({
      data: {
        title: body.title,
        author: body.author || "",
        slug,
        coverImage: body.coverImage || null,
        readAt: body.readAt ? new Date(body.readAt) : null,
        summary: body.summary || null,
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create book");
  }
}
