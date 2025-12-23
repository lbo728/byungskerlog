import { prisma } from "@/lib/prisma";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { AboutPageActions } from "@/components/about-page-actions";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";
import Script from "next/script";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export const metadata: Metadata = {
  title: "About | Byungsker Log",
  description: "제품 주도 개발을 지향하는 개발자, 이병우(Byungsker)에 대해 알아보세요. 소프트웨어 개발, 제품 개발, 스타트업에 대한 경험과 인사이트를 공유합니다.",
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    title: "About | Byungsker Log",
    description: "제품 주도 개발을 지향하는 개발자, 이병우(Byungsker)에 대해 알아보세요.",
    url: `${siteUrl}/about`,
    type: "profile",
  },
};

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

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "이병우 (Byungsker)",
  url: siteUrl,
  jobTitle: "Software Developer",
  description: "제품 주도 개발을 지향하는 소프트웨어 개발자",
  knowsAbout: ["소프트웨어 개발", "제품 개발", "스타트업", "Next.js", "React", "TypeScript"],
  sameAs: [
    "https://github.com/lbo728",
    "https://linkedin.com/in/byungsker",
  ],
};

export default async function AboutPage() {
  const page = await getAboutPage();

  const title = page?.title || "About";
  const content = page?.content || "";

  return (
    <>
      <Script
        id="person-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        strategy="afterInteractive"
      />
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
    </>
  );
}
