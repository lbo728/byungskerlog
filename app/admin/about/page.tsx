"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownToolbar } from "@/components/markdown-toolbar";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ArrowLeft } from "lucide-react";

export default function AdminAboutPage() {
  const user = useUser({ or: "redirect" });
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Load existing About page content
  useEffect(() => {
    const fetchPage = async () => {
      setIsFetching(true);
      try {
        const response = await fetch("/api/pages/about");
        if (response.ok) {
          const page = await response.json();
          setTitle(page.title);
          setContent(page.content);
        }
      } catch (error) {
        console.error("Error fetching page:", error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchPage();
  }, []);

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

  const handleSave = async () => {
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
      const response = await fetch("/api/pages/about", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update page");
      }

      alert("About 페이지가 저장되었습니다.");
      router.push("/about");
      router.refresh();
    } catch (error) {
      alert("페이지 저장 중 오류가 발생했습니다.");
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
            <Button variant="ghost" size="sm" onClick={() => router.push("/about")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              나가기
            </Button>
            <h1 className="text-lg font-semibold">About 페이지 편집</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={handleSave} disabled={isLoading || isFetching}>
              {isLoading ? "저장 중..." : "저장하기"}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto">
        {isFetching ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
            <p className="text-muted-foreground">페이지를 불러오는 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[calc(100vh-3.5rem)]">
            {/* 왼쪽: 편집기 */}
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
              </div>

              <MarkdownToolbar onInsert={insertMarkdown} />

              <Textarea
                ref={textareaRef}
                placeholder="내용을 입력하세요..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 border-none rounded-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-8 font-mono text-base"
                disabled={isLoading}
              />
            </div>

            {/* 오른쪽: 미리보기 */}
            <div className="bg-muted/20 overflow-y-auto">
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
    </div>
  );
}
