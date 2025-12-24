import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication with Stack Auth
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find the post first to get the slug for revalidation
    const post = await prisma.post.findUnique({
      where: { id },
      select: { slug: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Delete the post
    await prisma.post.delete({
      where: { id },
    });

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/posts");
    revalidatePath("/tags");
    revalidatePath(`/posts/${post.slug}`);

    return NextResponse.json({ message: "Post deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication with Stack Auth
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, slug, excerpt, content, tags, published, thumbnail, seriesId } = body;

    // Update post
    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(excerpt !== undefined && { excerpt }),
        ...(content !== undefined && { content }),
        ...(tags !== undefined && { tags }),
        ...(published !== undefined && { published }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(seriesId !== undefined && { seriesId }),
      },
    });

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/posts");
    revalidatePath("/tags");
    revalidatePath(`/posts/${post.slug}`);

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error updating post:", error);

    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
      }

      if (error.code === "P2025") {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}
