"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import { common, createLowlight } from "lowlight";
import { EmbedCard } from "@/components/editor/tiptap/EmbedCardExtension";
import { LinkModal } from "@/components/editor/tiptap/LinkModal";
import { useLinkModal } from "@/hooks/useLinkModal";
import { useImageUpload } from "@/hooks/useImageUpload";

const lowlight = createLowlight(common);

interface AboutEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutEditModal({ open, onOpenChange }: AboutEditModalProps) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("About");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isEditorReady, setIsEditorReady] = useState(false);

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
      TiptapImage.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-lg shadow-md my-6 max-w-full h-auto",
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
    content: "",
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
        class: "prose prose-lg dark:prose-invert max-w-none focus:outline-none p-6 min-h-full",
      },
    },
    onCreate: () => {
      setIsEditorReady(true);
    },
  });

  const { isDragging, isUploading, handleDragOver, handleDragLeave, handleDrop, handleFileSelect } = useImageUpload({
    editor,
    imageInputRef,
  });

  const { isLinkModalOpen, setIsLinkModalOpen, selectedText, currentLinkUrl, handleLinkSubmit, handleLinkRemove } =
    useLinkModal({ editor });

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

  useEffect(() => {
    if (editor && isEditorReady && content && !isFetching) {
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
  }, [content, editor, isEditorReady, isFetching]);

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
          <div className="about-editor-container flex flex-col h-[calc(95vh-5rem)] overflow-hidden">
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

            <div
              className={`about-editor-area relative flex-1 overflow-y-auto ${
                isDragging ? "ring-2 ring-primary ring-inset bg-primary/5" : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <EditorContent editor={editor} className="tiptap-editor h-full" />
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
        )}

        <LinkModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          onSubmit={handleLinkSubmit}
          onRemove={currentLinkUrl ? handleLinkRemove : undefined}
          initialUrl={currentLinkUrl}
          selectedText={selectedText}
        />
      </DialogContent>
    </Dialog>
  );
}
