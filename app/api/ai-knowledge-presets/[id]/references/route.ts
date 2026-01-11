import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const references = await prisma.aIKnowledgeReference.findMany({
      where: { presetId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(references);
  } catch (error) {
    return handleApiError(error, "Failed to fetch references");
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      throw ApiError.validationError("title and content are required");
    }

    const preset = await prisma.aIKnowledgePreset.findUnique({
      where: { id },
    });

    if (!preset) {
      throw ApiError.notFound("Preset");
    }

    const reference = await prisma.aIKnowledgeReference.create({
      data: {
        title,
        content,
        presetId: id,
      },
    });

    return NextResponse.json(reference, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create reference");
  }
}
