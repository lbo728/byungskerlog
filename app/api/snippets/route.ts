import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";

export async function GET() {
  try {
    const snippets = await prisma.customSnippet.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json(snippets);
  } catch (error) {
    return handleApiError(error, "Failed to fetch snippets");
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const body = await request.json();
    const { name, content, shortcut, order } = body;

    if (!name || !content) {
      throw ApiError.validationError("name and content are required");
    }

    const maxOrder = await prisma.customSnippet.aggregate({
      _max: { order: true },
    });

    const snippet = await prisma.customSnippet.create({
      data: {
        name,
        content,
        shortcut: shortcut || null,
        order: order ?? (maxOrder._max.order ?? 0) + 1,
      },
    });

    return NextResponse.json(snippet, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create snippet");
  }
}
