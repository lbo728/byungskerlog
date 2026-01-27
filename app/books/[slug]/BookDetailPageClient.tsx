"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BookFormModal } from "@/components/books/BookFormModal";
import { useDeleteBook } from "@/hooks/useDeleteBook";

interface BookDetailPageClientProps {
  book: {
    id: string;
    title: string;
    author: string | null;
    coverImage: string | null;
    startedAt: Date | null;
    finishedAt: Date | null;
    summary: string | null;
    posts: Array<{
      id: string;
      title: string;
      slug: string;
      excerpt: string | null;
      createdAt: Date;
    }>;
  };
  isAdmin: boolean;
}

export function BookDetailPageClient({ book, isAdmin }: BookDetailPageClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("edit");
  const { deleteBook } = useDeleteBook({ redirectTo: "/books" });

  const handleEdit = () => {
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
  };

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

            {(book.startedAt || book.finishedAt) && (
              <p className="text-sm text-gray-500 mb-4">
                {book.startedAt && book.finishedAt
                  ? `${new Date(book.startedAt).toLocaleDateString("ko-KR")} - ${new Date(book.finishedAt).toLocaleDateString("ko-KR")}`
                  : book.startedAt
                    ? `${new Date(book.startedAt).toLocaleDateString("ko-KR")} -`
                    : `- ${new Date(book.finishedAt!).toLocaleDateString("ko-KR")}`}
              </p>
            )}

            {book.summary && (
              <div className="book-summary bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                <p className="text-gray-700 dark:text-gray-300">{book.summary}</p>
              </div>
            )}

            {isAdmin && (
              <div className="admin-actions flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  수정
                </Button>
                <Button variant="destructive" size="sm" onClick={() => deleteBook(book.id, book.title)}>
                  <Trash2 className="h-4 w-4 mr-1" />
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

      <BookFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        book={book}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
