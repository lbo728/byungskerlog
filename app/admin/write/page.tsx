"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublishModal } from "@/components/publish-modal";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { optimizeImage } from "@/lib/image-optimizer";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import TiptapLink from "@tiptap/extension-link";
import { EmbedCard } from "@/components/tiptap/embed-card-extension";
import { LinkModal } from "@/components/tiptap/link-modal";
import { WriteTocDesktop, WriteTocMobile } from "@/components/write-toc";
import { common, createLowlight } from "lowlight";

const lowlight = createLowlight(common);

export default function WritePage() {
  useUser({ or: "redirect" });
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(draftIdParam);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
  const [existingSeriesId, setExistingSeriesId] = useState<string | null>(null);
  const [existingExcerpt, setExistingExcerpt] = useState<string | null>(null);
  const [existingType, setExistingType] = useState<"LONG" | "SHORT">("LONG");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [currentLinkUrl, setCurrentLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "javascript",
      }),
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2 hover:text-primary/80 transition-colors cursor-pointer",
        },
      }),
      EmbedCard,
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
        linkify: true,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      interface EditorStorageWithMarkdown extends Record<string, unknown> {
        markdown?: {
          getMarkdown: () => string;
        };
      }
      const storage = editor.storage as unknown as EditorStorageWithMarkdown;
      const markdown = storage.markdown?.getMarkdown() || editor.getText();
      setContent(markdown);
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg dark:prose-invert max-w-none focus:outline-none p-8 pb-16 min-h-full",
      },
    },
  });

  const openLinkModal = useCallback(() => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");
    setSelectedText(text);

    const linkMark = editor.getAttributes("link");
    setCurrentLinkUrl(linkMark.href || "");

    setIsLinkModalOpen(true);
  }, [editor]);

  const handleLinkSubmit = useCallback((url: string) => {
    if (!editor) return;

    if (selectedText) {
      editor.chain().focus().setLink({ href: url }).run();
    } else {
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
    }
  }, [editor, selectedText]);

  const handleLinkRemove = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  }, [editor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openLinkModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openLinkModal]);

  useEffect(() => {
    if (editor && content) {
      interface EditorStorageWithMarkdown extends Record<string, unknown> {
        markdown?: {
          getMarkdown: () => string;
        };
      }
      const storage = editor.storage as unknown as EditorStorageWithMarkdown;
      const currentMarkdown = storage.markdown?.getMarkdown() || editor.getText();
      if (content !== currentMarkdown) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

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
      if (!editor) return;

      const imageMarkdown = `![${altText}](${url})\n`;
      editor.commands.insertContent(imageMarkdown);
      editor.commands.focus();
    },
    [editor]
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

  // 파일 선택 핸들러
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
          setExistingType(post.type || "LONG");
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* 통합 헤더 - 메인 헤더 + 서브 헤더 */}
      <header className="write-header-wrapper fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        {/* 메인 헤더 영역 */}
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
        {/* 서브 헤더 영역 */}
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

      {/* 컨텐츠 - 헤더 높이(h-16 + h-14 = 7.5rem) 만큼 패딩 */}
      <div className="container mx-auto max-w-full overflow-x-hidden pt-[7.5rem]">
        {isFetchingPost ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-7.5rem)]">
            <p className="text-muted-foreground">글을 불러오는 중...</p>
          </div>
        ) : (
          <div className="write-editor-container relative flex justify-center min-h-[calc(100vh-7.5rem)]">
            {/* 데스크톱 TOC - 에디터 우측에 고정 */}
            <aside className="write-toc-sidebar hidden xl:block fixed right-8 top-36 w-64 z-30">
              <WriteTocDesktop content={content} editorSelector=".tiptap-editor" />
            </aside>

            <div className="write-editor-panel w-full max-w-4xl flex flex-col pt-4 overflow-x-hidden xl:mr-72">
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

              <div
                className={`content-editor relative flex-1 ${isDragging ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <EditorContent editor={editor} className="tiptap-editor h-full overflow-y-auto" />
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
          </div>
        )}
      </div>

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
        initialType={existingType}
      />

      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSubmit={handleLinkSubmit}
        onRemove={currentLinkUrl ? handleLinkRemove : undefined}
        initialUrl={currentLinkUrl}
        selectedText={selectedText}
      />

      {/* 모바일 TOC 플로팅 버튼 */}
      <WriteTocMobile content={content} editorSelector=".tiptap-editor" />
    </div>
  );
}
