import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const book = await prisma.book.findUnique({
      where: { id },
      include: { posts: true },
    });

    if (!book) {
      return ApiError.notFound("Book").toResponse();
    }

    return NextResponse.json(book);
  } catch (error) {
    return handleApiError(error, "Failed to fetch book");
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const { id } = await params;

    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) {
      return ApiError.notFound("Book").toResponse();
    }

    const body = await request.json();
    const book = await prisma.book.update({
      where: { id },
      data: {
        title: body.title,
        author: body.author,
        coverImage: body.coverImage,
        readAt: body.readAt ? new Date(body.readAt) : null,
        summary: body.summary,
      },
    });

    return NextResponse.json(book);
  } catch (error) {
    return handleApiError(error, "Failed to update book");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const { id } = await params;

    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) {
      return ApiError.notFound("Book").toResponse();
    }

    await prisma.book.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, "Failed to delete book");
  }
}
