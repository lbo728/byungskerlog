"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/Sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { DatePicker } from "@/components/ui/DatePicker";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, ArrowLeft, Search, X, Upload, Link as LinkIcon, Image as ImageIcon } from "lucide-react";

interface BookFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  book?: {
    id: string;
    title: string;
    author: string | null;
    coverImage: string | null;
    startedAt: Date | null;
    finishedAt: Date | null;
    summary: string | null;
  };
  onSuccess?: () => void;
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

export function BookFormModal({ open, onOpenChange, mode, book, onSuccess }: BookFormModalProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [step, setStep] = useState<1 | 2>(mode === "edit" ? 2 : 1);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [startedAt, setStartedAt] = useState<Date | undefined>(undefined);
  const [finishedAt, setFinishedAt] = useState<Date | undefined>(undefined);
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedBookIndex, setSelectedBookIndex] = useState<number | null>(null);
  const [selectedBookData, setSelectedBookData] = useState<BookSearchResult | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const resultsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUploadMethod, setImageUploadMethod] = useState<"url" | "file" | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState("");

  useEffect(() => {
    if (open && !isInitialized) {
      if (mode === "edit" && book) {
        setTitle(book.title);
        setAuthor(book.author || "");
        setCoverImage(book.coverImage || "");
        setStartedAt(book.startedAt ? new Date(book.startedAt) : undefined);
        setFinishedAt(book.finishedAt ? new Date(book.finishedAt) : undefined);
        setSummary(book.summary || "");
        setStep(2);
      } else {
        setTitle("");
        setAuthor("");
        setCoverImage("");
        setCoverImageFile(null);
        setStartedAt(undefined);
        setFinishedAt(undefined);
        setSummary("");
        setStep(1);
        setSearchQuery("");
        setSearchResults([]);
        setSelectedBookData(null);
      }
      setSelectedIndex(-1);
      setSelectedBookIndex(null);
      setIsInitialized(true);
    }
  }, [open, isInitialized, mode, book]);

  useEffect(() => {
    if (!open && isInitialized) {
      setIsInitialized(false);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedIndex(-1);
      setSelectedBookIndex(null);
      setSelectedBookData(null);
      setCoverImageFile(null);
      setTempImageUrl("");
      setImageUploadMethod(null);
    }
  }, [open, isInitialized]);

  useEffect(() => {
    if (step === 2 && selectedBookData && mode === "add") {
      setTitle(selectedBookData.title);
      setAuthor(selectedBookData.author);
      setCoverImage(selectedBookData.coverImage);
    }
  }, [step, selectedBookData, mode]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setSearchResults(data.results || []);
      setSelectedIndex(-1);
      setSelectedBookIndex(null);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("책 검색 중 오류가 발생했습니다");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }

      searchDebounceRef.current = setTimeout(() => {
        handleSearch();
      }, 300);
    } else {
      setSearchResults([]);
      setSelectedIndex(-1);
      setSelectedBookIndex(null);
    }

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, handleSearch]);

  const handleBookClick = (index: number) => {
    setSelectedBookIndex(index);
  };

  const handleConfirmSelection = () => {
    if (selectedBookIndex !== null) {
      const book = searchResults[selectedBookIndex];
      setSelectedBookData(book);
      setStep(2);
      setSelectedBookIndex(null);
      toast.success("책 정보가 입력되었습니다");
    }
  };

  const handleManualInput = () => {
    setSelectedBookData(null);
    setTitle("");
    setAuthor("");
    setCoverImage("");
    setStep(2);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedIndex(-1);
    setSelectedBookIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      if (selectedIndex === searchResults.length) {
        handleManualInput();
      } else {
        handleBookClick(selectedIndex);
      }
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  const handleThumbnailClick = () => {
    setShowImageDialog(true);
  };

  const handleImageMethodSelect = (method: "url" | "file") => {
    setImageUploadMethod(method);
    if (method === "file") {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("파일 크기는 5MB 이하여야 합니다");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/upload/thumbnail?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        body: file,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setCoverImage(data.url);
      setCoverImageFile(file);
      setShowImageDialog(false);
      setImageUploadMethod(null);
      toast.success("이미지가 업로드되었습니다");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("이미지 업로드 중 오류가 발생했습니다");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUrlSubmit = () => {
    const error = validateUrl(tempImageUrl);
    if (error) {
      toast.error(error);
      return;
    }

    setCoverImage(tempImageUrl);
    setShowImageDialog(false);
    setImageUploadMethod(null);
    setTempImageUrl("");
    toast.success("이미지 URL이 설정되었습니다");
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

    try {
      setIsLoading(true);

      const payload = {
        title: trimmedTitle,
        author: trimmedAuthor || null,
        coverImage: trimmedCoverImage || null,
        startedAt: startedAt?.toISOString() || null,
        finishedAt: finishedAt?.toISOString() || null,
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
  }, [title, author, coverImage, startedAt, finishedAt, summary, mode, book?.id, onSuccess, onOpenChange]);

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
    startedAt?.getTime() !== (book?.startedAt ? new Date(book.startedAt).getTime() : undefined) ||
    finishedAt?.getTime() !== (book?.finishedAt ? new Date(book.finishedAt).getTime() : undefined) ||
    summary !== (book?.summary || "");

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      onOpenChange(false);
    }
  };

  const headerIcon = (
    <div className="book-form-modal-icon flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 mb-2">
      {mode === "add" ? (
        step === 1 ? (
          <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        ) : (
          <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        )
      ) : (
        <Pencil className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      )}
    </div>
  );

  const headerTitle = mode === "add" ? (step === 1 ? "책 검색" : "책 추가") : "책 수정";

  const headerDescription =
    mode === "add"
      ? step === 1
        ? "추가할 책을 검색하거나 직접 입력하세요."
        : "책의 정보를 입력합니다."
      : "책의 정보를 수정합니다.";

  const searchStepContent = (
    <div className="book-search-step h-full flex flex-col space-y-4 py-4">
      <div className="search-input-section space-y-2 flex-shrink-0">
        <Label>책 제목 검색</Label>
        <div className="search-input-wrapper relative">
          <Input
            placeholder="책 제목을 입력하세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="pr-10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="검색어 지우기"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {(searchQuery.trim().length > 0 || searchResults.length > 0) && (
        <div
          ref={resultsRef}
          className="search-results-dropdown flex-1 overflow-y-auto space-y-1 border rounded-md p-2"
        >
          {isSearching && (
            <div className="loading-skeleton space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-3 animate-pulse">
                  <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isSearching && searchResults.length === 0 && searchQuery.trim().length > 0 && (
            <div className="empty-state p-6 text-center text-gray-500">
              <p className="font-medium">&quot;{searchQuery}&quot; 검색 결과가 없습니다</p>
              <p className="text-sm mt-1">다른 검색어로 시도하거나 직접 입력해주세요</p>
            </div>
          )}

          {!isSearching &&
            searchResults.map((result, index) => (
              <button
                key={result.isbn}
                type="button"
                onClick={() => handleBookClick(index)}
                className={`book-result-item w-full text-left p-3 rounded transition-colors ${
                  selectedBookIndex === index
                    ? "bg-blue-100 dark:bg-blue-900 border-2 border-blue-500"
                    : selectedIndex === index
                      ? "bg-gray-100 dark:bg-gray-800"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex gap-3 items-center">
                  {result.coverImage && (
                    <img
                      src={result.coverImage}
                      alt={result.title}
                      className="w-12 h-16 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{result.title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{result.author}</div>
                    <div className="text-xs text-gray-500 truncate">{result.publisher}</div>
                  </div>
                  {selectedBookIndex === index && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmSelection();
                      }}
                      className="ml-2 flex-shrink-0"
                    >
                      선택 완료
                    </Button>
                  )}
                </div>
              </button>
            ))}

          {!isSearching && searchResults.length > 0 && (
            <button
              type="button"
              onClick={handleManualInput}
              className={`w-full text-left p-3 rounded transition-colors border-t ${
                selectedIndex === searchResults.length
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="font-medium">직접 입력하기</span>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );

  const inputStepContentDesktop = (
    <div className="book-input-step h-full flex flex-col overflow-hidden py-4">
      {mode === "add" && (
        <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)} className="mb-2 w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로가기
        </Button>
      )}

      <div className="book-form-content flex-1 flex flex-row gap-6 overflow-hidden">
        <div className="thumbnail-column w-[150px] flex-shrink-0 space-y-2">
          <Label className="text-sm font-medium">표지 이미지</Label>
          <button
            type="button"
            onClick={handleThumbnailClick}
            className="thumbnail-preview w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            {coverImage ? (
              <img src={coverImage} alt="표지 미리보기" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-center text-gray-400">
                <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">클릭하여 이미지 추가</p>
              </div>
            )}
          </button>
        </div>

        {/* RIGHT: Input fields */}
        <div className="inputs-column flex-1 overflow-y-auto space-y-4 pr-2">
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

          <div className="started-at-section space-y-2">
            <Label className="text-sm font-medium">
              독서 시작일 <span className="text-muted-foreground font-normal">(선택)</span>
            </Label>
            <DatePicker value={startedAt} onChange={setStartedAt} placeholder="시작일 선택" disabled={isLoading} />
          </div>

          <div className="finished-at-section space-y-2">
            <Label className="text-sm font-medium">
              독서 완료일 <span className="text-muted-foreground font-normal">(선택)</span>
            </Label>
            <DatePicker value={finishedAt} onChange={setFinishedAt} placeholder="완료일 선택" disabled={isLoading} />
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
      </div>
    </div>
  );

  const inputStepContentMobile = (
    <div className="book-input-step h-full flex flex-col overflow-hidden">
      {mode === "add" && (
        <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)} className="mb-3 w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로가기
        </Button>
      )}

      <div className="book-form-content flex-1 overflow-y-auto space-y-5">
        <div className="thumbnail-section space-y-2">
          <Label className="text-sm font-medium">표지 이미지</Label>
          <button
            type="button"
            onClick={handleThumbnailClick}
            className="thumbnail-preview w-full h-56 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            {coverImage ? (
              <img src={coverImage} alt="표지 미리보기" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-center text-gray-400">
                <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">클릭하여 이미지 추가</p>
              </div>
            )}
          </button>
        </div>

        <div className="inputs-section space-y-4">
          <div className="title-section space-y-2">
            <Label htmlFor="title-mobile" className="text-sm font-medium">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title-mobile"
              placeholder="책 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="author-section space-y-2">
            <Label htmlFor="author-mobile" className="text-sm font-medium">
              저자 <span className="text-muted-foreground font-normal">(선택)</span>
            </Label>
            <Input
              id="author-mobile"
              placeholder="저자명"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="started-at-section space-y-2">
            <Label className="text-sm font-medium">
              독서 시작일 <span className="text-muted-foreground font-normal">(선택)</span>
            </Label>
            <DatePicker value={startedAt} onChange={setStartedAt} placeholder="시작일 선택" disabled={isLoading} />
          </div>

          <div className="finished-at-section space-y-2">
            <Label className="text-sm font-medium">
              독서 완료일 <span className="text-muted-foreground font-normal">(선택)</span>
            </Label>
            <DatePicker value={finishedAt} onChange={setFinishedAt} placeholder="완료일 선택" disabled={isLoading} />
          </div>

          <div className="summary-section space-y-2">
            <Label htmlFor="summary-mobile" className="text-sm font-medium">
              요약 <span className="text-muted-foreground font-normal">(선택)</span>
            </Label>
            <Textarea
              id="summary-mobile"
              placeholder="책에 대한 간단한 요약이나 감상을 작성해주세요."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={isLoading}
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const footerContent = step === 2 && (
    <>
      {mode === "edit" && book && (
        <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading} className="mr-auto">
          <Trash2 className="h-4 w-4 mr-2" />
          삭제
        </Button>
      )}
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
        취소
      </Button>
      <Button type="button" onClick={handleSubmit} disabled={isLoading || !hasChanges}>
        {isLoading ? "저장 중..." : "저장"}
      </Button>
    </>
  );

  return (
    <>
      {!isMobile && (
        <Dialog open={open} onOpenChange={handleDialogClose}>
          <DialogContent
            className="book-form-modal sm:max-w-[700px] h-[600px] max-h-[80vh] flex flex-col"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader className="flex-shrink-0">
              {headerIcon}
              <DialogTitle>{headerTitle}</DialogTitle>
              <DialogDescription>{headerDescription}</DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-hidden">
              {step === 1 && mode === "add" ? searchStepContent : inputStepContentDesktop}
            </div>

            {step === 2 && <DialogFooter className="gap-2 flex-shrink-0">{footerContent}</DialogFooter>}
          </DialogContent>
        </Dialog>
      )}

      {isMobile && (
        <Sheet open={open} onOpenChange={handleDialogClose}>
          <SheetContent
            side="bottom"
            className="h-[90vh] flex flex-col px-6"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <SheetHeader className="flex-shrink-0 px-0 pt-2 pb-4">
              <SheetTitle>{headerTitle}</SheetTitle>
              <SheetDescription>{headerDescription}</SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {step === 1 && mode === "add" ? searchStepContent : inputStepContentMobile}
            </div>

            {step === 2 && <SheetFooter className="flex-row gap-3 pt-4 pb-2 p-0 border-t">{footerContent}</SheetFooter>}
          </SheetContent>
        </Sheet>
      )}

      <AlertDialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>표지 이미지 추가</AlertDialogTitle>
            <AlertDialogDescription>이미지를 업로드하거나 URL을 입력하세요.</AlertDialogDescription>
          </AlertDialogHeader>

          {!imageUploadMethod ? (
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleImageMethodSelect("file")}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                파일 업로드
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleImageMethodSelect("url")}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                URL 입력
              </Button>
            </div>
          ) : imageUploadMethod === "url" ? (
            <div className="space-y-3">
              <Input
                placeholder="https://example.com/image.jpg"
                value={tempImageUrl}
                onChange={(e) => setTempImageUrl(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setImageUploadMethod(null);
                    setTempImageUrl("");
                  }}
                  className="flex-1"
                >
                  뒤로
                </Button>
                <Button type="button" onClick={handleUrlSubmit} className="flex-1" disabled={!tempImageUrl.trim()}>
                  확인
                </Button>
              </div>
            </div>
          ) : null}

          {!imageUploadMethod && (
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
            </AlertDialogFooter>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
