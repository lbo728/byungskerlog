"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

interface BookFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  book?: {
    id: string;
    title: string;
    author: string | null;
    coverImage: string | null;
    readAt: Date | null;
    summary: string | null;
  };
  onSuccess?: () => void;
}

function validateUrl(value: string): string | null {
  if (!value.trim()) {
    return null;
  }

  try {
    new URL(value);
    return null;
  } catch {
    return "유효한 URL을 입력해주세요.";
  }
}

interface BookSearchResult {
  title: string;
  author: string;
  isbn: string;
  coverImage: string;
  publisher: string;
  publishDate: string;
  description: string;
}

export function BookFormModal({ open, onOpenChange, mode, book, onSuccess }: BookFormModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [readAt, setReadAt] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [coverImageError, setCoverImageError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  if (open && !isInitialized) {
    if (mode === "edit" && book) {
      setTitle(book.title);
      setAuthor(book.author || "");
      setCoverImage(book.coverImage || "");
      setReadAt(book.readAt ? new Date(book.readAt).toISOString().split("T")[0] : "");
      setSummary(book.summary || "");
    } else {
      setTitle("");
      setAuthor("");
      setCoverImage("");
      setReadAt("");
      setSummary("");
    }
    setCoverImageError(null);
    setIsInitialized(true);
  }

  if (!open && isInitialized) {
    setIsInitialized(false);
    setSearchQuery("");
    setSearchResults([]);
  }

  const handleCoverImageChange = (value: string) => {
    setCoverImage(value);
    setCoverImageError(validateUrl(value));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      toast.error("책 검색 중 오류가 발생했습니다");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBook = (book: BookSearchResult) => {
    setTitle(book.title);
    setAuthor(book.author);
    setCoverImage(book.coverImage);
    setSearchResults([]);
    setSearchQuery("");
    toast.success("책 정보가 입력되었습니다");
  };

  const handleSubmit = useCallback(async () => {
    const trimmedTitle = title.trim();
    const trimmedAuthor = author.trim();
    const trimmedCoverImage = coverImage.trim();
    const trimmedSummary = summary.trim();

    if (!trimmedTitle) {
      toast.error("제목을 입력해주세요.");
      return;
    }

    if (trimmedCoverImage && validateUrl(trimmedCoverImage)) {
      setCoverImageError(validateUrl(trimmedCoverImage));
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        title: trimmedTitle,
        author: trimmedAuthor || null,
        coverImage: trimmedCoverImage || null,
        readAt: readAt ? new Date(readAt).toISOString() : null,
        summary: trimmedSummary || null,
      };

      const url = mode === "add" ? "/api/books" : `/api/books/${book?.id}`;
      const method = mode === "add" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("책 저장 중 오류가 발생했습니다");
      }

      const successMessage = mode === "add" ? "책이 추가되었습니다" : "책이 수정되었습니다";
      toast.success(successMessage);
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "책 저장 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  }, [title, author, coverImage, readAt, summary, mode, book?.id, onSuccess, onOpenChange]);

  const handleDelete = useCallback(async () => {
    if (!book?.id) return;

    if (!window.confirm("정말 이 책을 삭제하시겠습니까?")) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`/api/books/${book.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("책 삭제 중 오류가 발생했습니다");
      }

      toast.success("책이 삭제되었습니다");
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "책 삭제 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  }, [book?.id, onSuccess, onOpenChange]);

  const hasChanges =
    mode === "add" ||
    title !== (book?.title || "") ||
    author !== (book?.author || "") ||
    coverImage !== (book?.coverImage || "") ||
    readAt !== (book?.readAt ? new Date(book.readAt).toISOString().split("T")[0] : "") ||
    summary !== (book?.summary || "");

  const hasErrors = !!coverImageError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="book-form-modal sm:max-w-[500px]">
        <DialogHeader>
          <div className="book-form-modal-icon flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 mb-2">
            {mode === "add" ? (
              <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Pencil className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <DialogTitle>{mode === "add" ? "책 추가" : "책 수정"}</DialogTitle>
          <DialogDescription>
            {mode === "add" ? "새로운 책을 추가합니다." : "책의 정보를 수정합니다."}
          </DialogDescription>
        </DialogHeader>

        <div className="book-form space-y-4 py-4">
          {mode === "add" && (
            <div className="book-search-section space-y-2 pb-4 border-b">
              <Label>책 검색</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="책 제목으로 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  disabled={isLoading}
                />
                <Button type="button" onClick={handleSearch} disabled={isSearching || isLoading}>
                  {isSearching ? "검색 중..." : "검색"}
                </Button>
              </div>
              {searchResults.length > 0 && (
                <div className="search-results max-h-60 overflow-y-auto space-y-2 mt-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.isbn}
                      type="button"
                      onClick={() => handleSelectBook(result)}
                      className="w-full text-left p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex gap-3">
                        {result.coverImage && (
                          <img src={result.coverImage} alt={result.title} className="w-12 h-16 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{result.title}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{result.author}</div>
                          <div className="text-xs text-gray-500">{result.publisher}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="title-section space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="책 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="author-section space-y-2">
            <Label htmlFor="author" className="text-sm font-medium">
              저자 <span className="text-muted-foreground font-normal">(선택)</span>
            </Label>
            <Input
              id="author"
              placeholder="저자명"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="cover-image-section space-y-2">
            <Label htmlFor="coverImage" className="text-sm font-medium">
              표지 이미지 URL <span className="text-muted-foreground font-normal">(선택)</span>
            </Label>
            <Input
              id="coverImage"
              placeholder="https://example.com/image.jpg"
              value={coverImage}
              onChange={(e) => handleCoverImageChange(e.target.value)}
              disabled={isLoading}
            />
            {coverImageError && <p className="text-sm text-destructive">{coverImageError}</p>}
          </div>

          <div className="read-at-section space-y-2">
            <Label htmlFor="readAt" className="text-sm font-medium">
              읽은 날짜 <span className="text-muted-foreground font-normal">(선택)</span>
            </Label>
            <Input
              id="readAt"
              type="date"
              value={readAt}
              onChange={(e) => setReadAt(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="summary-section space-y-2">
            <Label htmlFor="summary" className="text-sm font-medium">
              요약 <span className="text-muted-foreground font-normal">(선택)</span>
            </Label>
            <Textarea
              id="summary"
              placeholder="책에 대한 간단한 요약이나 감상을 작성해주세요."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={isLoading}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {mode === "edit" && book && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading} className="mr-auto">
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            취소
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isLoading || hasErrors || !hasChanges}>
            {isLoading ? "저장 중..." : "확인"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
