"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownToolbar } from "@/components/editor/markdown-toolbar";
import { MarkdownRenderer } from "@/components/post/markdown-renderer";

interface AboutEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutEditModal({ open, onOpenChange }: AboutEditModalProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState("About");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (open) {
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
    }
  }, [open]);

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
      toast.warning("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      toast.warning("내용을 입력해주세요.");
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

      toast.success("About 페이지가 저장되었습니다.");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error("페이지 저장 중 오류가 발생했습니다.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[95vw] max-h-[95vh] h-[95vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>About 페이지 편집</DialogTitle>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isLoading || isFetching}
              className="mr-8"
            >
              {isLoading ? "저장 중..." : "저장하기"}
            </Button>
          </div>
        </DialogHeader>

        {isFetching ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">페이지를 불러오는 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-[calc(95vh-5rem)] overflow-hidden">
            {/* 왼쪽: 편집기 */}
            <div className="border-r border-border flex flex-col overflow-hidden">
              <div className="px-6 pt-4">
                <Input
                  type="text"
                  placeholder="제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-4xl font-bold border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 bg-transparent"
                  disabled={isLoading}
                />
              </div>

              <div className="px-6 pt-4">
                <MarkdownToolbar onInsert={insertMarkdown} />
              </div>

              <Textarea
                ref={textareaRef}
                placeholder="내용을 입력하세요..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 border-none rounded-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 px-6 py-4 font-mono text-base overflow-y-auto"
                disabled={isLoading}
              />
            </div>

            {/* 오른쪽: 미리보기 */}
            <div className="bg-muted/20 overflow-y-auto">
              <div className="p-6">
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
      </DialogContent>
    </Dialog>
  );
}
