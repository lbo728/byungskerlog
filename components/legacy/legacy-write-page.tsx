/**
 * 레거시 글쓰기 페이지 (현재 미사용)
 *
 * TipTap WYSIWYG 에디터 도입 전 사용하던 textarea 기반 마크다운 에디터.
 * 좌우 분할 레이아웃: 왼쪽 에디터 + 오른쪽 미리보기
 *
 * 주요 기능:
 * - Textarea 기반 마크다운 편집
 * - 실시간 마크다운 미리보기 (MarkdownRenderer)
 * - 마크다운 툴바 (MarkdownToolbar)
 * - 드래그 앤 드롭 이미지 업로드
 * - 클립보드 이미지 붙여넣기
 * - 모바일 미리보기 모달
 * - 태그 자동완성
 * - 임시저장
 *
 * 복구 방법:
 * 이 파일을 app/admin/write/page.tsx로 복사하고
 * TipTap 관련 import 제거 후 사용
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownToolbar } from "@/components/editor/markdown-toolbar";
import { MarkdownRenderer } from "@/components/post/markdown-renderer";
import { PublishModal } from "@/components/modals/publish-modal";
import { FloatingActionButton } from "@/components/layout/floating-action-button";
import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { optimizeImage } from "@/lib/image-optimizer";
import { generateExcerpt } from "@/lib/excerpt";

export default function LegacyWritePage() {
  useUser({ or: "redirect" });
  const router = useRouter();
  const searchParams = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const postId = searchParams.get("id");
  const draftIdParam = searchParams.get("draft");
  const isEditMode = !!postId;

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [content, setContent] = useState("");
  const [isLoading] = useState(false);
  const [isFetchingPost, setIsFetchingPost] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [scrollRatio, setScrollRatio] = useState(0);
  const previewContentRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(draftIdParam);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [modalPostType, setModalPostType] = useState<"LONG" | "SHORT">("LONG");
  const [modalThumbnailUrl, setModalThumbnailUrl] = useState<string | null>(null);
  const [modalThumbnailFile, setModalThumbnailFile] = useState<File | null>(null);
  const [modalSeriesId, setModalSeriesId] = useState<string | null>(null);
  const [modalExcerpt, setModalExcerpt] = useState<string>("");
  const [isExcerptInitialized, setIsExcerptInitialized] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAllTags = async () => {
      try {
        const response = await fetch("/api/tags");
        if (response.ok) {
          const data = await response.json();
          setAllTags(data.map((item: { tag: string }) => item.tag));
        }
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      }
    };
    fetchAllTags();
  }, []);

  const filteredSuggestions = tagInput.trim()
    ? allTags.filter(
        (tag) =>
          tag.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(tag)
      )
    : [];

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    setTagInput("");
    setShowTagSuggestions(false);
    setSelectedSuggestionIndex(0);
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : 0));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (showTagSuggestions && filteredSuggestions.length > 0) {
        addTag(filteredSuggestions[selectedSuggestionIndex]);
      } else if (tagInput.trim()) {
        addTag(tagInput);
      }
      return;
    }

    if (e.key === "Escape") {
      setShowTagSuggestions(false);
      return;
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    setShowTagSuggestions(value.trim().length > 0);
    setSelectedSuggestionIndex(0);
  };

  const insertMarkdown = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let newText = text;

    if (selectedText && text.includes("텍스트")) {
      newText = text.replace("텍스트", selectedText);
    }

    const before = content.substring(0, start);
    const after = content.substring(end);
    const newContent = before + newText + after;

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + newText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleTempSave = async () => {
    setIsSavingDraft(true);
    try {
      if (draftId) {
        const response = await fetch(`/api/drafts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, tags, content }),
        });
        if (!response.ok) throw new Error("Failed to update draft");
        toast.success("임시저장되었습니다.");
      } else {
        const response = await fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, tags, content }),
        });
        if (!response.ok) throw new Error("Failed to create draft");
        const data = await response.json();
        setDraftId(data.id);
        window.history.replaceState(null, "", `/admin/write?draft=${data.id}`);
        toast.success("임시저장되었습니다.");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("임시저장에 실패했습니다.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const openPreviewModal = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const ratio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight || 1);
      setScrollRatio(Math.max(0, Math.min(1, ratio)));
    }
    setIsPreviewModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  useEffect(() => {
    if (isPreviewModalOpen && previewContentRef.current) {
      const previewEl = previewContentRef.current;
      const targetScroll = scrollRatio * (previewEl.scrollHeight - previewEl.clientHeight);
      previewEl.scrollTop = targetScroll;
    }
  }, [isPreviewModalOpen, scrollRatio]);

  const closePreviewModal = () => {
    const previewEl = previewContentRef.current;
    let ratio = scrollRatio;

    if (previewEl) {
      ratio = previewEl.scrollTop / (previewEl.scrollHeight - previewEl.clientHeight || 1);
      ratio = Math.max(0, Math.min(1, ratio));
      setScrollRatio(ratio);
    }

    setIsPreviewModalOpen(false);
    document.body.style.overflow = "";

    setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        const targetScroll = ratio * (textarea.scrollHeight - textarea.clientHeight);
        textarea.scrollTop = targetScroll;
      }
    }, 0);
  };

  const uploadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.warning("이미지 파일만 업로드 가능합니다.");
      return null;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.warning("파일 크기는 10MB 이하여야 합니다.");
      return null;
    }

    setIsUploading(true);

    try {
      let optimizedFile = file;
      const targetSize = 500 * 1024;

      if (file.size > targetSize) {
        toast.info("이미지 최적화 중...");
        optimizedFile = await optimizeImage(file, targetSize);
      }

      const filename = `${Date.now()}-${optimizedFile.name}`;
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
        method: "POST",
        body: optimizedFile,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const blob = await response.json();
      return blob.url;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("이미지 업로드에 실패했습니다.");
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const insertImageMarkdown = useCallback(
    (url: string, altText: string = "image") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const imageMarkdown = `![${altText}](${url})`;
      const start = textarea.selectionStart;
      const before = content.substring(0, start);
      const after = content.substring(start);
      const newContent = before + imageMarkdown + "\n" + after;

      setContent(newContent);

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + imageMarkdown.length + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [content]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      for (const file of imageFiles) {
        const url = await uploadImage(file);
        if (url) {
          insertImageMarkdown(url, file.name.replace(/\.[^/.]+$/, ""));
        }
      }
    },
    [uploadImage, insertImageMarkdown]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      for (const file of Array.from(files)) {
        if (file.type.startsWith("image/")) {
          const url = await uploadImage(file);
          if (url) {
            insertImageMarkdown(url, file.name.replace(/\.[^/.]+$/, ""));
          }
        }
      }

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    },
    [uploadImage, insertImageMarkdown]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageItems = items.filter((item) => item.type.startsWith("image/"));

      if (imageItems.length === 0) return;

      e.preventDefault();

      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          const url = await uploadImage(file);
          if (url) {
            insertImageMarkdown(url, "pasted-image");
          }
        }
      }
    },
    [uploadImage, insertImageMarkdown]
  );

  useEffect(() => {
    if (isEditMode && postId) {
      const fetchPost = async () => {
        setIsFetchingPost(true);
        try {
          const response = await fetch(`/api/posts/${postId}`);
          if (!response.ok) throw new Error("Failed to fetch post");
          const post = await response.json();

          setTitle(post.title);
          setTags(post.tags || []);
          setContent(post.content);
          setModalPostType(post.type || "LONG");
          setModalThumbnailUrl(post.thumbnail || null);
          setModalThumbnailFile(null);
          setModalSeriesId(post.seriesId || null);
          setModalExcerpt(post.excerpt || "");
          setIsExcerptInitialized(true);
        } catch (error) {
          console.error("Error fetching post:", error);
          toast.error("글을 불러오는데 실패했습니다.");
          router.push("/admin/posts");
        } finally {
          setIsFetchingPost(false);
        }
      };
      fetchPost();
    } else if (draftIdParam) {
      const fetchDraft = async () => {
        setIsFetchingPost(true);
        try {
          const response = await fetch(`/api/drafts/${draftIdParam}`);
          if (!response.ok) throw new Error("Failed to fetch draft");
          const draft = await response.json();

          setTitle(draft.title || "");
          setTags(draft.tags || []);
          setContent(draft.content || "");
          setDraftId(draft.id);
        } catch (error) {
          console.error("Error fetching draft:", error);
          toast.error("임시저장을 불러오는데 실패했습니다.");
          router.push("/admin/drafts");
        } finally {
          setIsFetchingPost(false);
        }
      };
      fetchDraft();
    }
  }, [isEditMode, postId, draftIdParam, router]);

  const handleOpenPublishModal = () => {
    if (!title.trim()) {
      toast.warning("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      toast.warning("내용을 입력해주세요.");
      return;
    }
    if (!isExcerptInitialized) {
      setModalExcerpt(generateExcerpt(content, 150));
      setIsExcerptInitialized(true);
    }
    setIsPublishModalOpen(true);
  };

  const handleThumbnailFileChange = useCallback((file: File | null) => {
    if (modalThumbnailUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(modalThumbnailUrl);
    }

    if (file) {
      const blobUrl = URL.createObjectURL(file);
      setModalThumbnailUrl(blobUrl);
      setModalThumbnailFile(file);
    } else {
      setModalThumbnailUrl(null);
      setModalThumbnailFile(null);
    }
  }, [modalThumbnailUrl]);

  const handleThumbnailRemove = useCallback(() => {
    if (modalThumbnailUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(modalThumbnailUrl);
    }
    setModalThumbnailUrl(null);
    setModalThumbnailFile(null);
  }, [modalThumbnailUrl]);

  const handlePublishSuccess = (slug: string) => {
    toast.success(isEditMode ? "글이 수정되었습니다." : "글이 발행되었습니다.");
    router.push(`/posts/${slug}`);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="write-header-wrapper fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="write-main-header border-b border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Image
                  src="/logo-byungsker.png"
                  alt="병스커 BLOG"
                  width={180}
                  height={84}
                  className="logo-image rounded select-none"
                  priority
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
              </Link>
            </div>
          </div>
        </div>
        <div className="write-sub-header border-b border-border">
          <div className="container mx-auto px-2 sm:px-4 h-14 flex items-center justify-between gap-2 max-w-full">
            <div className="write-header-left flex items-center gap-1 sm:gap-4 min-w-0 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={() => router.push("/admin/posts")} className="gap-1 sm:gap-2 px-2 sm:px-3">
                <ArrowLeft className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">나가기</span>
              </Button>
              <h1 className="text-base sm:text-lg font-semibold truncate">{isEditMode ? "글 수정" : "글쓰기"}</h1>
            </div>
            <div className="write-header-right flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {!isEditMode && (
                <Button variant="ghost" size="sm" onClick={handleTempSave} disabled={isLoading || isSavingDraft} className="px-2 sm:px-3">
                  <span className="hidden sm:inline">{isSavingDraft ? "저장 중..." : "임시저장"}</span>
                  <span className="sm:hidden">{isSavingDraft ? "저장..." : "임시"}</span>
                </Button>
              )}
              <Button variant="default" size="sm" onClick={handleOpenPublishModal} disabled={isLoading || isFetchingPost} className="px-2 sm:px-3">
                <span className="hidden sm:inline">{isEditMode ? "수정하기" : "출간하기"}</span>
                <span className="sm:hidden">{isEditMode ? "수정" : "출간"}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-full overflow-x-hidden pt-[7.5rem]">
        {isFetchingPost ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-7.5rem)]">
            <p className="text-muted-foreground">글을 불러오는 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[calc(100vh-7.5rem)]">
            <div className="write-editor-panel border-r border-border flex flex-col pt-4 overflow-x-hidden">
              <div className="px-2 sm:px-0">
                <Input
                  type="text"
                  placeholder="제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="title-input text-base font-bold border-none p-4 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 bg-transparent"
                  disabled={isLoading}
                />
                <div className="tag-input-section mt-4 p-4">
                  <div className="tag-list flex flex-wrap gap-2 mb-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        onClick={() => removeTag(index)}
                        className="tag-item px-3 py-1 bg-primary/10 text-primary rounded-full text-sm cursor-pointer hover:bg-primary/20 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="tag-autocomplete relative">
                    <Input
                      ref={tagInputRef}
                      type="text"
                      placeholder="태그를 입력하세요 (엔터로 등록)"
                      value={tagInput}
                      onChange={handleTagInputChange}
                      onKeyDown={handleTagInput}
                      onFocus={() => tagInput.trim() && setShowTagSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowTagSuggestions(false), 150)}
                      className="border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-muted-foreground bg-transparent"
                      disabled={isLoading}
                    />
                    {showTagSuggestions && filteredSuggestions.length > 0 && (
                      <ul className="tag-suggestions absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                        {filteredSuggestions.slice(0, 10).map((suggestion, index) => (
                          <li
                            key={suggestion}
                            onMouseDown={() => addTag(suggestion)}
                            className={`tag-suggestion-item px-3 py-2 cursor-pointer text-sm transition-colors ${
                              index === selectedSuggestionIndex
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted"
                            }`}
                          >
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <MarkdownToolbar onInsert={insertMarkdown} />

              <div
                className={`content-editor relative flex-1 ${isDragging ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Textarea
                  ref={textareaRef}
                  placeholder="당신의 이야기를 적어보세요... (이미지를 드래그하거나 붙여넣기 할 수 있습니다)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onPaste={handlePaste}
                  className="absolute inset-0 border-none rounded-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-8 pb-16 font-mono text-base"
                  disabled={isLoading || isUploading}
                />
                {isDragging && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/10 pointer-events-none z-10">
                    <div className="text-primary font-medium text-lg">이미지를 여기에 놓으세요</div>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                    <div className="text-muted-foreground font-medium">이미지 업로드 중...</div>
                  </div>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* 오른쪽: 미리보기 (데스크톱만) */}
            <div className="hidden lg:block bg-muted/20 overflow-y-auto">
              <div className="p-8">
                <h1 className="text-4xl font-bold mb-8">{title || "제목 없음"}</h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {content ? (
                    <MarkdownRenderer content={content} />
                  ) : (
                    <p className="text-muted-foreground italic">여기에 미리보기가 표시됩니다...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 플로팅 액션 버튼 (모바일/태블릿) */}
      <div className="lg:hidden">
        <FloatingActionButton
          onPreview={openPreviewModal}
          onClosePreview={closePreviewModal}
          isPreviewActive={isPreviewModalOpen}
          onImageUpload={() => imageInputRef.current?.click()}
          disabled={isLoading || isUploading}
        />
      </div>

      {/* 모바일 미리보기 풀 모달 */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-[100] bg-background">
          <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
            <div className="container mx-auto px-4 h-14 flex items-center justify-between">
              <h2 className="text-lg font-semibold">미리보기</h2>
              <Button variant="ghost" size="sm" onClick={closePreviewModal} className="gap-2">
                <X className="h-4 w-4" />
                닫기
              </Button>
            </div>
          </div>

          <div ref={previewContentRef} className="overflow-y-auto h-[calc(100vh-3.5rem)]">
            <div className="container mx-auto p-4 sm:p-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8">{title || "제목 없음"}</h1>
              <div className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none">
                {content ? (
                  <MarkdownRenderer content={content} />
                ) : (
                  <p className="text-muted-foreground italic">여기에 미리보기가 표시됩니다...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 발행 모달 */}
      <PublishModal
        open={isPublishModalOpen}
        onOpenChange={setIsPublishModalOpen}
        title={title}
        content={content}
        tags={tags}
        isEditMode={isEditMode}
        postId={postId || undefined}
        draftId={draftId}
        onPublishSuccess={handlePublishSuccess}
        postType={modalPostType}
        onPostTypeChange={setModalPostType}
        thumbnailUrl={modalThumbnailUrl}
        onThumbnailUrlChange={setModalThumbnailUrl}
        thumbnailFile={modalThumbnailFile}
        onThumbnailFileChange={handleThumbnailFileChange}
        onThumbnailRemove={handleThumbnailRemove}
        seriesId={modalSeriesId}
        onSeriesIdChange={setModalSeriesId}
        excerpt={modalExcerpt}
        onExcerptChange={setModalExcerpt}
      />
    </div>
  );
}
