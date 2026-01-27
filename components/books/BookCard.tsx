import Image from "next/image";
import Link from "next/link";
import { Book } from "@prisma/client";

interface BookCardProps {
  book: Book & {
    _count: {
      posts: number;
    };
  };
}

export default function BookCard({ book }: BookCardProps) {
  return (
    <Link
      href={`/books/${book.slug}`}
      className="book-card group block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="book-cover-wrapper relative w-full h-64 bg-gray-100 dark:bg-gray-700">
        {book.coverImage ? (
          <Image src={book.coverImage} alt={book.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="book-info p-4">
        <h3 className="book-title text-lg font-semibold mb-1 line-clamp-2">{book.title}</h3>
        <p className="book-author text-sm text-gray-600 dark:text-gray-400 mb-2">{book.author || "저자 미상"}</p>
        <div className="book-meta flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 h-4">
          <span>관련글 {book._count.posts}개</span>
          {book.readAt && (
            <>
              <span>·</span>
              <span>{new Date(book.readAt).getFullYear()}년</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
