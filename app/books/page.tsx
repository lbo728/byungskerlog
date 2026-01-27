import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { BooksPageClient } from "./BooksPageClient";

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
    orderBy: { finishedAt: "desc" },
  });
}

export default async function BooksPage() {
  const books = await getBooks();
  const user = await getAuthUser();
  const isAdmin = user != null;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <BooksPageClient books={books} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
