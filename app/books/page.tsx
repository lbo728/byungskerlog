import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import BookCard from "@/components/books/BookCard";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "읽은 책 | Byungskerlog",
  description: "내가 읽은 책들과 관련 글 모음",
};

async function getBooks() {
  return await prisma.book.findMany({
    include: {
      _count: {
        select: { posts: true },
      },
    },
    orderBy: { readAt: "desc" },
  });
}

export default async function BooksPage() {
  const books = await getBooks();
  const user = await getAuthUser();
  const isAdmin = user != null;

  return (
    <div className="books-page-container max-w-7xl mx-auto px-4 py-12">
      <div className="books-header flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">읽은 책</h1>
        {isAdmin && <Button>책 추가</Button>}
      </div>

      {books.length === 0 ? (
        <div className="empty-state text-center py-20 text-gray-500">
          <p>아직 등록된 책이 없습니다</p>
        </div>
      ) : (
        <div className="books-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
