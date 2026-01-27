"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { BookFormModal } from "@/components/books/BookFormModal";

interface Book {
  id: string;
  title: string;
  author: string | null;
  coverImage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  summary: string | null;
  slug: string;
  _count: {
    posts: number;
  };
}

export default function AdminBooksPage() {
  useUser({ or: "redirect" });
  const router = useRouter();

  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBooks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/books");
      if (!response.ok) throw new Error("Failed to fetch books");
      const data = await response.json();
      setBooks(data);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast.error("책 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleAddBook = () => {
    setSelectedBook(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleEditBook = (book: Book) => {
    setSelectedBook(book);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDeleteClick = (book: Book) => {
    setBookToDelete(book);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/books/${bookToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete book");

      toast.success("책이 삭제되었습니다.");
      setDeleteDialogOpen(false);
      setBookToDelete(null);
      fetchBooks();
    } catch (error) {
      console.error("Error deleting book:", error);
      toast.error("책 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSuccess = () => {
    fetchBooks();
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="admin-books-page min-h-screen bg-background">
      <header className="admin-header sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              나가기
            </Button>
            <h1 className="text-lg font-semibold">책 관리</h1>
          </div>
          <Button variant="default" size="sm" onClick={handleAddBook} className="gap-2">
            <Plus className="h-4 w-4" />책 추가
          </Button>
        </div>
      </header>

      <div className="books-content container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">등록된 책이 없습니다.</p>
            <Button onClick={handleAddBook}>첫 책 추가하기</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {books.map((book) => (
              <div
                key={book.id}
                className="book-card border border-border rounded-lg p-4 sm:p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="book-info flex gap-4 items-start flex-1 min-w-0">
                    {book.coverImage ? (
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-16 h-24 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-24 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl font-semibold truncate">{book.title}</h2>
                      <p className="text-sm text-muted-foreground mb-2">{book.author || "저자 미상"}</p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                        <span>관련글 {book._count.posts}개</span>
                        {book.finishedAt && <span>완독일: {formatDate(book.finishedAt)}</span>}
                      </div>
                      {book.summary && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{book.summary}</p>
                      )}
                    </div>
                  </div>
                  <div className="book-actions flex items-center gap-2 flex-shrink-0 self-end sm:self-start">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/books/${book.slug}`)}>
                      보기
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditBook(book)} className="gap-2">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(book)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BookFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        book={selectedBook || undefined}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>책 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "{bookToDelete?.title}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
