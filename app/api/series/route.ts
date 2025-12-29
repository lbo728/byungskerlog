import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function GET() {
  try {
    const series = await prisma.series.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return NextResponse.json(series);
  } catch (error) {
    return handleApiError(error, "Failed to fetch series");
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      throw ApiError.validationError("Series name is required");
    }

    const slug = generateSlug(name);

    const series = await prisma.series.create({
      data: {
        name,
        slug,
        description: description || null,
      },
    });

    return NextResponse.json(series, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return ApiError.duplicateEntry("series with this name").toResponse();
    }
    return handleApiError(error, "Failed to create series");
  }
}
