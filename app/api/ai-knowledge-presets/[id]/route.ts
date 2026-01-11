import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const preset = await prisma.aIKnowledgePreset.findUnique({
      where: { id },
      include: {
        references: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!preset) {
      throw ApiError.notFound("Preset");
    }

    return NextResponse.json(preset);
  } catch (error) {
    return handleApiError(error, "Failed to fetch preset");
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const { id } = await params;
    const body = await request.json();
    const { name, instruction, lastUsedAt } = body;

    const preset = await prisma.aIKnowledgePreset.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(instruction !== undefined && { instruction }),
        ...(lastUsedAt !== undefined && { lastUsedAt: new Date(lastUsedAt) }),
      },
      include: {
        references: true,
      },
    });

    return NextResponse.json(preset);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return ApiError.notFound("Preset").toResponse();
    }
    return handleApiError(error, "Failed to update preset");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const { id } = await params;

    await prisma.aIKnowledgePreset.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Preset deleted successfully" });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return ApiError.notFound("Preset").toResponse();
    }
    return handleApiError(error, "Failed to delete preset");
  }
}
