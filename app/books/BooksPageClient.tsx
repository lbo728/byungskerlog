"use client";

import BookCard from "@/components/books/BookCard";
import type { Book } from "@prisma/client";
interface BooksPageClientProps {
  books: (Book & { _count: { posts: number } })[];
}

export function BooksPageClient({ books }: BooksPageClientProps) {
  return (
    <>
      <div className="books-header flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">읽은 책</h1>
      </div>

      {books.length === 0 ? (
        <div className="empty-state text-center py-20 text-muted-foreground">
          <p>아직 등록된 책이 없습니다</p>
        </div>
      ) : (
        <div className="books-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </>
  );
}
