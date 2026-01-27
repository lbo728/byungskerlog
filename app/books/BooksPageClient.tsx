"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { BookFormModal } from "@/components/books/BookFormModal";
import BookCard from "@/components/books/BookCard";

interface BooksPageClientProps {
  books: any[];
  isAdmin: boolean;
}

export function BooksPageClient({ books, isAdmin }: BooksPageClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");

  const handleAddBook = () => {
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <div className="books-header flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">읽은 책</h1>
        {isAdmin && <Button onClick={handleAddBook}>책 추가</Button>}
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

      <BookFormModal open={isModalOpen} onOpenChange={setIsModalOpen} mode={modalMode} onSuccess={handleSuccess} />
    </>
  );
}
