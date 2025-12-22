"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useStackApp } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownToolbar } from "@/components/markdown-toolbar";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ArrowLeft, Eye, X } from "lucide-react";
import { generateExcerpt } from "@/lib/excerpt";

export default function WritePage() {
  const user = useUser({ or: "redirect" });
  const app = useStackApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const postId = searchParams.get("id");
  const isEditMode = !!postId;

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPost, setIsFetchingPost] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  // 자동 슬러그 생성 (영문/숫자만)
  const generateSlug = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // 한글 제거, 영문/숫자만
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "") // 앞뒤 하이픈 제거
      .trim();

    // 빈 문자열이면 타임스탬프 사용
    return slug || `post-${Date.now()}`;
  };

  // 태그 추가
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    setTagInput("");
  };

  // 태그 삭제
  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  // 태그 입력 처리
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 한글 입력 조합 중일 때는 무시
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    }
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

  const handleTempSave = () => {
    localStorage.setItem("draft", JSON.stringify({ title, tags, content }));
    alert("임시저장되었습니다.");
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

  // Load existing post for edit mode
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
        } catch (error) {
          console.error("Error fetching post:", error);
          alert("글을 불러오는데 실패했습니다.");
          router.push("/admin/posts");
        } finally {
          setIsFetchingPost(false);
        }
      };
      fetchPost();
    } else {
      // Load draft for new post
      const draft = localStorage.getItem("draft");
      if (draft) {
        const { title: draftTitle, tags: draftTags, content: draftContent } = JSON.parse(draft);
        if (confirm("임시저장된 글이 있습니다. 불러오시겠습니까?")) {
          setTitle(draftTitle || "");
          setTags(draftTags || []);
          setContent(draftContent || "");
        }
      }
    }
  }, [isEditMode, postId, router]);

  const handlePublish = async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const excerpt = generateExcerpt(content, 150);

      if (isEditMode && postId) {
        // Update existing post
        const response = await fetch(`/api/posts/${postId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            excerpt,
            content,
            tags,
            published: true,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update post");
        }

        const data = await response.json();
        alert("글이 수정되었습니다.");
        router.push(`/posts/${data.slug}`);
        router.refresh();
      } else {
        // Create new post
        const slug = generateSlug(title);

        const response = await fetch("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            slug,
            excerpt,
            content,
            tags,
            published: true,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create post");
        }

        const data = await response.json();
        localStorage.removeItem("draft");
        router.push(`/posts/${data.slug}`);
        router.refresh();
      }
    } catch (error) {
      alert(isEditMode ? "글 수정 중 오류가 발생했습니다." : "글 발행 중 오류가 발생했습니다.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
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
              <Button variant="ghost" size="sm" onClick={handleTempSave} disabled={isLoading}>
                임시저장
              </Button>
            )}
            <Button variant="default" size="sm" onClick={handlePublish} disabled={isLoading || isFetchingPost}>
              {isLoading ? (isEditMode ? "수정 중..." : "출간 중...") : (isEditMode ? "수정하기" : "출간하기")}
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
              <div className="mt-4 p-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      onClick={() => removeTag(index)}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm cursor-pointer hover:bg-primary/20 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Input
                  type="text"
                  placeholder="태그를 입력하세요 (엔터로 등록)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInput}
                  className="border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-muted-foreground bg-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>

            <MarkdownToolbar onInsert={insertMarkdown} />

            <Textarea
              ref={textareaRef}
              placeholder="당신의 이야기를 적어보세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 border-none rounded-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-8 font-mono text-base"
              disabled={isLoading}
            />
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
              <Button
                variant="ghost"
                size="sm"
                onClick={closePreviewModal}
                className="gap-2"
              >
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
    </div>
  );
}
