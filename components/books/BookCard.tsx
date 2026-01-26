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
      {book.coverImage && (
        <div className="book-cover-wrapper relative w-full h-64 bg-gray-100">
          <Image src={book.coverImage} alt={book.title} fill className="object-cover" />
        </div>
      )}

      <div className="book-info p-4">
        <h3 className="book-title text-lg font-semibold mb-1 line-clamp-2">{book.title}</h3>
        <p className="book-author text-sm text-gray-600 dark:text-gray-400 mb-2">{book.author}</p>
        <div className="book-meta flex items-center gap-2 text-xs text-gray-500">
          <span>관련글 {book._count.posts}개</span>
          {book.readAt && <span>· {new Date(book.readAt).getFullYear()}년</span>}
        </div>
      </div>
    </Link>
  );
}
