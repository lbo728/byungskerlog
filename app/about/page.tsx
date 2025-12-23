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

  const title = page?.title || "About";
  const content = page?.content || "";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">{title}</h1>
          <AboutPageActions />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-normal prose-li:leading-normal">
              <MarkdownRenderer content={content} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
