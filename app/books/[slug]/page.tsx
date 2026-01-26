import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

interface BookDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function getBook(slug: string) {
  return await prisma.book.findUnique({
    where: { slug },
    include: {
      posts: {
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function generateMetadata({ params }: BookDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBook(slug);

  if (!book) {
    return {
      title: "책을 찾을 수 없습니다",
    };
  }

  return {
    title: `${book.title} | Byungskerlog`,
    description: book.summary || `${book.author}의 ${book.title}`,
  };
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { slug } = await params;
  const book = await getBook(slug);

  if (!book) {
    notFound();
  }

  const user = await getAuthUser();
  const isAdmin = user != null;

  return (
    <div className="book-detail-page max-w-4xl mx-auto px-4 py-12">
      <div className="book-detail-header mb-8">
        <div className="flex flex-col md:flex-row gap-8">
          {book.coverImage && (
            <div className="book-cover-large relative w-full md:w-64 h-96 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={book.coverImage} alt={book.title} fill className="object-cover" />
            </div>
          )}

          <div className="book-info-section flex-1">
            <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">{book.author}</p>

            {book.readAt && (
              <p className="text-sm text-gray-500 mb-4">
                읽은 날짜: {new Date(book.readAt).toLocaleDateString("ko-KR")}
              </p>
            )}

            {book.summary && (
              <div className="book-summary bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                <p className="text-gray-700 dark:text-gray-300">{book.summary}</p>
              </div>
            )}

            {isAdmin && (
              <div className="admin-actions flex gap-2">
                <Button variant="outline" size="sm">
                  수정
                </Button>
                <Button variant="outline" size="sm">
                  삭제
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="related-posts-section">
        <h2 className="text-2xl font-bold mb-6">관련 글 ({book.posts.length})</h2>

        {book.posts.length === 0 ? (
          <div className="empty-state text-center py-12 text-gray-500">
            <p>이 책과 관련된 글이 없습니다</p>
          </div>
        ) : (
          <div className="posts-list space-y-4">
            {book.posts.map((post) => (
              <Link
                key={post.id}
                href={`/${post.slug}`}
                className="post-item block p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                {post.excerpt && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{post.excerpt}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">{new Date(post.createdAt).toLocaleDateString("ko-KR")}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
