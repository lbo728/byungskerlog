import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const { id } = await params;
    const body = await request.json();
    const { name, content, shortcut, order } = body;

    const snippet = await prisma.customSnippet.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(content !== undefined && { content }),
        ...(shortcut !== undefined && { shortcut: shortcut || null }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json(snippet);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return ApiError.notFound("Snippet").toResponse();
    }
    return handleApiError(error, "Failed to update snippet");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const { id } = await params;

    await prisma.customSnippet.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Snippet deleted successfully" });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return ApiError.notFound("Snippet").toResponse();
    }
    return handleApiError(error, "Failed to delete snippet");
  }
}
