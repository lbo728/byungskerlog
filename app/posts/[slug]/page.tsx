import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { TableOfContents } from "@/components/toc";
import { ThemeToggle } from "@/components/theme-toggle";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import type { Post } from "@/lib/types";

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { slug: true },
  });

  return posts.map((post: { slug: string }) => ({
    slug: post.slug,
  }));
}

async function getPost(slug: string): Promise<Post | null> {
  const post = await prisma.post.findUnique({
    where: { slug },
  });

  if (!post) return null;
  return post;
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link href="/">
            <Button
              variant="ghost"
              className="pl-0 hover:pl-2 transition-all text-muted-foreground hover:text-foreground"
            >
              ← Back to home
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-12">
          <article className="max-w-3xl">
            <header className="mb-8">
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-4 leading-tight">
                {post.title}
              </h1>
              <div className="flex items-center text-muted-foreground text-sm">
                <time dateTime={post.createdAt.toISOString()}>{format(new Date(post.createdAt), "MMMM d, yyyy")}</time>
              </div>
            </header>

            <Separator className="my-8" />

            <MarkdownRenderer content={post.content} />
          </article>

          <aside className="hidden xl:block">
            <TableOfContents content={post.content} />
          </aside>
        </div>
      </div>
    </div>
  );
}
