import { prisma } from "@/lib/prisma";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { AboutPageActions } from "@/components/about-page-actions";
import { Card, CardContent } from "@/components/ui/card";

export const revalidate = 3600;

async function getAboutPage() {
  try {
    const page = await prisma.page.findUnique({
      where: { slug: "about" },
    });
    return page;
  } catch (error) {
    console.error("Error fetching about page:", error);
    return null;
  }
}

export default async function AboutPage() {
  const page = await getAboutPage();

  // Default content if page doesn't exist in database yet
  const defaultContent = `프로덕트 디자이너로 커리어를 시작하여 현재는 프론트엔드 개발을 하고 있습니다.

제품 중심 개발을 지향하고, 매일 꾸준 글쓰기를 하고 있습니다.

개발과 디자인, 비즈니스, 글쓰기에 대한 글을 쓰고 있어요.

---

### 활동
- TeoConf3 - 주니어 개발자의, 200일간 혼자만의 짧은 글쓰기로 성장하기

---

### Contact
[링크드인](https://www.linkedin.com) | [스레드](https://www.threads.net) | [X](https://x.com)`;

  const title = page?.title || "About";
  const content = page?.content || defaultContent;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">{title}</h1>
          <AboutPageActions />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <MarkdownRenderer content={content} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
