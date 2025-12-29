import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const series = await prisma.series.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(series);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return ApiError.notFound("Series").toResponse();
    }
    return handleApiError(error, "Failed to update series");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const { id } = await params;

    await prisma.series.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return ApiError.notFound("Series").toResponse();
    }
    return handleApiError(error, "Failed to delete series");
  }
}
