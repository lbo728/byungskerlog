import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const drafts = await prisma.draft.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(drafts);
  } catch (error) {
    return handleApiError(error, "Failed to fetch drafts");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const body = await request.json();
    const { title, content, tags } = body;

    const draft = await prisma.draft.create({
      data: {
        title: title || "",
        content: content || "",
        tags: tags || [],
        authorId: user.id,
      },
    });

    return NextResponse.json(draft, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create draft");
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const body = await request.json();
    const { ids, deleteAll } = body as { ids?: string[]; deleteAll?: boolean };

    if (deleteAll) {
      const result = await prisma.draft.deleteMany({
        where: { authorId: user.id },
      });

      revalidatePath("/admin/drafts");
      return NextResponse.json({ success: true, deletedCount: result.count });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw ApiError.validationError("ids array is required");
    }

    const existingDrafts = await prisma.draft.findMany({
      where: {
        id: { in: ids },
        authorId: user.id,
      },
      select: { id: true },
    });

    const existingIds = existingDrafts.map((d) => d.id);
    const notFoundIds = ids.filter((id) => !existingIds.includes(id));

    if (notFoundIds.length > 0) {
      throw ApiError.notFound(`Drafts not found: ${notFoundIds.join(", ")}`);
    }

    const result = await prisma.draft.deleteMany({
      where: {
        id: { in: ids },
        authorId: user.id,
      },
    });

    revalidatePath("/admin/drafts");
    return NextResponse.json({ success: true, deletedCount: result.count });
  } catch (error) {
    return handleApiError(error, "Failed to delete drafts");
  }
}
