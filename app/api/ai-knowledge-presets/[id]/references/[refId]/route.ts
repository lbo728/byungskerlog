import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; refId: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const { refId } = await params;
    const body = await request.json();
    const { title, content } = body;

    const reference = await prisma.aIKnowledgeReference.update({
      where: { id: refId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
      },
    });

    return NextResponse.json(reference);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return ApiError.notFound("Reference").toResponse();
    }
    return handleApiError(error, "Failed to update reference");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; refId: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const { refId } = await params;

    await prisma.aIKnowledgeReference.delete({
      where: { id: refId },
    });

    return NextResponse.json({ message: "Reference deleted successfully" });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return ApiError.notFound("Reference").toResponse();
    }
    return handleApiError(error, "Failed to delete reference");
  }
}
