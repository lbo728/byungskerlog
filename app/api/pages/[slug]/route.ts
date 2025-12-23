import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";
import { revalidatePath } from "next/cache";

const DEFAULT_ABOUT_CONTENT = `프로덕트 디자이너로 커리어를 시작하여 현재는 프론트엔드 개발을 하고 있습니다.

제품 중심 개발을 지향하고, 매일 꾸준 글쓰기를 하고 있습니다.

개발과 디자인, 비즈니스, 글쓰기에 대한 글을 쓰고 있어요.

---

### 활동
- TeoConf3 - 주니어 개발자의, 200일간 혼자만의 짧은 글쓰기로 성장하기

---

### Contact
[링크드인](https://www.linkedin.com) | [스레드](https://www.threads.net) | [X](https://x.com)`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    let page = await prisma.page.findUnique({
      where: { slug },
    });

    if (!page && slug === "about") {
      page = await prisma.page.create({
        data: {
          slug: "about",
          title: "About",
          content: DEFAULT_ABOUT_CONTENT,
        },
      });
    }

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Check authentication with Stack Auth
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const { title, content } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Upsert page (create if doesn't exist, update if exists)
    const page = await prisma.page.upsert({
      where: { slug },
      update: {
        title,
        content,
      },
      create: {
        slug,
        title,
        content,
      },
    });

    // Revalidate the page
    revalidatePath(`/${slug}`);

    return NextResponse.json(page);
  } catch (error) {
    console.error("Error updating page:", error);
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}
