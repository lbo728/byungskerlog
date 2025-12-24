"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownToolbar } from "@/components/markdown-toolbar";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { PublishModal } from "@/components/publish-modal";
import { ArrowLeft, Eye, X } from "lucide-react";
import { optimizeImage } from "@/lib/image-optimizer";

export default function WritePage() {
  useUser({ or: "redirect" });
  const router = useRouter();
  const searchParams = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(draftIdParam);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
  const [existingSeriesId, setExistingSeriesId] = useState<string | null>(null);
  const [existingExcerpt, setExistingExcerpt] = useState<string | null>(null);
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

  // 태그 추가
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    setTagInput("");
    setShowTagSuggestions(false);
    setSelectedSuggestionIndex(0);
  };

  // 태그 삭제
  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  // 태그 입력 처리
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
        // 기존 draft 업데이트
        const response = await fetch(`/api/drafts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, tags, content }),
        });
        if (!response.ok) throw new Error("Failed to update draft");
        toast.success("임시저장되었습니다.");
      } else {
        // 새 draft 생성
        const response = await fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, tags, content }),
        });
        if (!response.ok) throw new Error("Failed to create draft");
        const data = await response.json();
        setDraftId(data.id);
        // URL 업데이트 (새로고침 없이)
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

  // 모바일 미리보기 모달 열기
  const openPreviewModal = () => {
    setScrollPosition(window.scrollY);
    setIsPreviewModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  // 모바일 미리보기 모달 닫기
  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    document.body.style.overflow = "";
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
    }, 0);
  };

  // 이미지 업로드 함수
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

  // 이미지를 마크다운에 삽입
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

  // 드래그 앤 드롭 핸들러
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

  // 클립보드 붙여넣기 핸들러
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

  // Load existing post for edit mode or draft
  useEffect(() => {
    if (isEditMode && postId) {
      // 기존 글 수정 모드
      const fetchPost = async () => {
        setIsFetchingPost(true);
        try {
          const response = await fetch(`/api/posts/${postId}`);
          if (!response.ok) throw new Error("Failed to fetch post");
          const post = await response.json();

          setTitle(post.title);
          setTags(post.tags || []);
          setContent(post.content);
          setExistingThumbnail(post.thumbnail || null);
          setExistingSeriesId(post.seriesId || null);
          setExistingExcerpt(post.excerpt || null);
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
      // 임시저장 이어쓰기 모드
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
    setIsPublishModalOpen(true);
  };

  const handlePublishSuccess = (slug: string) => {
    toast.success(isEditMode ? "글이 수정되었습니다." : "글이 발행되었습니다.");
    router.push(`/posts/${slug}`);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/posts")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              나가기
            </Button>
            <h1 className="text-lg font-semibold">{isEditMode ? "글 수정" : "글쓰기"}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* 모바일 전용 미리보기 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={openPreviewModal}
              className="lg:hidden gap-2"
              disabled={isLoading}
            >
              <Eye className="h-4 w-4" />
              미리보기
            </Button>
            {!isEditMode && (
              <Button variant="ghost" size="sm" onClick={handleTempSave} disabled={isLoading || isSavingDraft}>
                {isSavingDraft ? "저장 중..." : "임시저장"}
              </Button>
            )}
            <Button variant="default" size="sm" onClick={handleOpenPublishModal} disabled={isLoading || isFetchingPost}>
              {isEditMode ? "수정하기" : "출간하기"}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto">
        {isFetchingPost ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
            <p className="text-muted-foreground">글을 불러오는 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[calc(100vh-3.5rem)]">
            <div className="border-r border-border flex flex-col pt-5">
              <div>
                <Input
                  type="text"
                  placeholder="제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-6xl font-bold border-none p-4 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 bg-transparent"
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
                className={`relative flex-1 ${isDragging ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}`}
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
                  className="absolute inset-0 border-none rounded-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-8 font-mono text-base"
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

      {/* 모바일 미리보기 풀 모달 */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-[100] bg-background">
          {/* 모달 헤더 */}
          <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
            <div className="container mx-auto px-4 h-14 flex items-center justify-between">
              <h2 className="text-lg font-semibold">미리보기</h2>
              <Button variant="ghost" size="sm" onClick={closePreviewModal} className="gap-2">
                <X className="h-4 w-4" />
                닫기
              </Button>
            </div>
          </div>

          {/* 모달 콘텐츠 */}
          <div className="overflow-y-auto h-[calc(100vh-3.5rem)]">
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
        initialThumbnail={existingThumbnail}
        initialSeriesId={existingSeriesId}
        initialExcerpt={existingExcerpt}
      />
    </div>
  );
}
