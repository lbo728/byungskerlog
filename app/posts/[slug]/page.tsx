import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

// ISR 설정 (1시간마다 재생성)
export const revalidate = 3600;

// 동적 경로 생성을 위한 generateStaticParams
export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { slug: true },
  });

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

async function getPost(slug: string) {
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
    <article className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 max-w-3xl">
      <div className="mb-8">
        <Link href="/">
          <Button
            variant="ghost"
            className="pl-0 hover:pl-2 transition-all text-muted-foreground hover:text-foreground"
          >
            ← Back to home
          </Button>
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-4 leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center text-muted-foreground text-sm">
          <time dateTime={post.createdAt.toISOString()}>{format(new Date(post.createdAt), "MMMM d, yyyy")}</time>
        </div>
      </header>

      <Separator className="my-8" />

      <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
    </article>
  );
}
