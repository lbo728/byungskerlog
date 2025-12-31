"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ThumbnailUploader } from "@/components/editor/thumbnail-uploader";
import { SeriesSelect } from "@/components/editor/series-select";
import { optimizeImage } from "@/lib/image-optimizer";
import { X } from "lucide-react";

const MAX_THUMBNAIL_SIZE = 500 * 1024;
const DRAG_CLOSE_THRESHOLD = 100;

interface PublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  tags: string[];
  isEditMode: boolean;
  postId?: string;
  draftId?: string | null;
  onPublishSuccess: (slug: string) => void;
  postType: "LONG" | "SHORT";
  onPostTypeChange: (type: "LONG" | "SHORT") => void;
  thumbnailUrl: string | null;
  thumbnailFile: File | null;
  onThumbnailFileChange: (file: File | null) => void;
  onThumbnailRemove: () => void;
  seriesId: string | null;
  onSeriesIdChange: (seriesId: string | null) => void;
  excerpt: string;
  onExcerptChange: (excerpt: string) => void;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

export function PublishModal({
  open,
  onOpenChange,
  title,
  content,
  tags,
  isEditMode,
  postId,
  draftId,
  onPublishSuccess,
  postType,
  onPostTypeChange,
  thumbnailUrl,
  thumbnailFile,
  onThumbnailFileChange,
  onThumbnailRemove,
  seriesId,
  onSeriesIdChange,
  excerpt,
  onExcerptChange,
}: PublishModalProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const isMobile = useIsMobile();

  const handlePostTypeChange = (type: "LONG" | "SHORT") => {
    onPostTypeChange(type);
    if (type === "SHORT") {
      onThumbnailRemove();
    }
  };

  const uploadThumbnail = async (file: File): Promise<string> => {
    let optimizedFile = file;

    if (file.size > MAX_THUMBNAIL_SIZE) {
      optimizedFile = await optimizeImage(file, MAX_THUMBNAIL_SIZE);
    }

    const response = await fetch(`/api/upload/thumbnail?filename=${encodeURIComponent(optimizedFile.name)}`, {
      method: "POST",
      body: optimizedFile,
      headers: {
        "Content-Length": optimizedFile.size.toString(),
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "썸네일 업로드에 실패했습니다.");
    }

    const blob = await response.json();
    return blob.url;
  };

  const handlePublish = useCallback(async () => {
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }

    if (!content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      let finalThumbnailUrl = thumbnailUrl;

      if (thumbnailFile) {
        finalThumbnailUrl = await uploadThumbnail(thumbnailFile);
      }

      const postData = {
        title: title.trim(),
        excerpt: excerpt.trim() || null,
        content,
        tags,
        type: postType,
        published: true,
        thumbnail: finalThumbnailUrl,
        seriesId,
      };

      let response: Response;

      if (isEditMode && postId) {
        response = await fetch(`/api/posts/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });
      } else {
        const slug = generateSlug(title);
        response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...postData, slug }),
        });
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "발행에 실패했습니다.");
      }

      const post = await response.json();

      if (draftId) {
        try {
          await fetch(`/api/drafts/${draftId}`, { method: "DELETE" });
        } catch (err) {
          console.error("Failed to delete draft:", err);
        }
      }

      onOpenChange(false);
      onPublishSuccess(post.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "발행에 실패했습니다.");
    } finally {
      setIsPublishing(false);
    }
  }, [title, content, tags, postType, excerpt, thumbnailUrl, thumbnailFile, seriesId, isEditMode, postId, draftId, onOpenChange, onPublishSuccess]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > DRAG_CLOSE_THRESHOLD) {
      onOpenChange(false);
    }
    setDragY(0);
  };

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 0) {
      setDragY(info.offset.y);
    }
  };

  const modalContent = (
    <>
      <div className="post-type-section space-y-3">
        <Label className="text-sm font-medium">글 유형</Label>
        <RadioGroup
          value={postType}
          onValueChange={(value) => handlePostTypeChange(value as "LONG" | "SHORT")}
          className="flex gap-4"
          disabled={isPublishing}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="LONG" id="type-long" />
            <Label htmlFor="type-long" className="cursor-pointer">Long Post</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="SHORT" id="type-short" />
            <Label htmlFor="type-short" className="cursor-pointer">Short Post</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="publish-modal-grid grid gap-6 sm:grid-cols-2 min-h-[280px]">
        {postType === "LONG" && (
          <div className="thumbnail-section">
            <ThumbnailUploader
              previewUrl={thumbnailUrl}
              onFileChange={onThumbnailFileChange}
              onRemove={onThumbnailRemove}
              disabled={isPublishing}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              썸네일을 업로드하면 포스트 목록에서 카드 형태로 표시됩니다.
            </p>
          </div>
        )}

        <div className={`settings-section space-y-6 ${postType === "SHORT" ? "sm:col-span-2" : ""}`}>
          <div className="excerpt-field space-y-2">
            <Label className="text-sm font-medium">설명</Label>
            <Textarea
              placeholder="포스트 설명을 입력하세요..."
              value={excerpt}
              onChange={(e) => onExcerptChange(e.target.value)}
              disabled={isPublishing}
              className="h-[120px] resize-none"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">{excerpt.length}/200</p>
          </div>

          <SeriesSelect value={seriesId} onChange={onSeriesIdChange} disabled={isPublishing} />
        </div>
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </>
  );

  const footerButtons = (
    <>
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPublishing}>
        취소
      </Button>
      <Button type="button" onClick={handlePublish} disabled={isPublishing}>
        {isPublishing ? (isEditMode ? "수정 중..." : "발행 중...") : isEditMode ? "수정하기" : "발행하기"}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="publish-modal-overlay fixed inset-0 z-50 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 - dragY / 300 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => onOpenChange(false)}
            />
            <motion.div
              className="publish-modal-mobile fixed inset-0 z-50 flex flex-col bg-background"
              style={{ height: "100dvh", width: "100dvw" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 300,
              }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
            >
              <header className="publish-modal-mobile-header flex items-center justify-between px-4 py-4 border-b safe-area-top">
                <div className="w-10" />
                <div className="publish-modal-drag-handle mx-auto">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                  disabled={isPublishing}
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div className="publish-modal-mobile-title px-4 pt-4 pb-2">
                <h2 className="text-lg font-semibold">포스트 미리보기</h2>
              </div>

              <main className="publish-modal-mobile-content flex-1 overflow-y-auto px-4 pb-24">
                <div className="space-y-6 py-4">
                  {modalContent}
                </div>
              </main>

              <footer className="publish-modal-mobile-footer fixed bottom-0 left-0 right-0 flex gap-2 p-4 bg-background border-t safe-area-bottom">
                {footerButtons}
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="publish-modal sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>포스트 미리보기</DialogTitle>
        </DialogHeader>

        <div className="publish-modal-content grid gap-6 py-4">
          {modalContent}
        </div>

        <DialogFooter className="gap-1">
          {footerButtons}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
