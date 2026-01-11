import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";

export async function GET() {
  try {
    const presets = await prisma.aIKnowledgePreset.findMany({
      orderBy: [{ lastUsedAt: "desc" }, { createdAt: "desc" }],
      include: {
        references: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return NextResponse.json(presets);
  } catch (error) {
    return handleApiError(error, "Failed to fetch presets");
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const body = await request.json();
    const { name, instruction } = body;

    if (!name || !instruction) {
      throw ApiError.validationError("name and instruction are required");
    }

    const preset = await prisma.aIKnowledgePreset.create({
      data: {
        name,
        instruction,
      },
      include: {
        references: true,
      },
    });

    return NextResponse.json(preset, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create preset");
  }
}
