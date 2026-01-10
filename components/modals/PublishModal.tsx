"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { ThumbnailUploader } from "@/components/editor/ThumbnailUploader";
import { SeriesSelect } from "@/components/editor/SeriesSelect";
import { optimizeImage } from "@/lib/image-optimizer";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { generateSlug } from "@/lib/utils/slug";
import { toast } from "sonner";

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
  slug?: string;
  onSlugChange?: (slug: string) => void;
  subSlug?: string;
  onSubSlugChange?: (subSlug: string) => void;
  socialLinkedinContent?: string;
  socialThreadsContent?: string[];
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
  slug = "",
  onSlugChange,
  subSlug = "",
  onSubSlugChange,
  socialLinkedinContent,
  socialThreadsContent,
}: PublishModalProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const [showSubSlugInput, setShowSubSlugInput] = useState(!!subSlug);
  const isMobile = useIsMobile();

  const handleSlugInputChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/\s+/g, "-");
    onSlugChange?.(normalized);
  };

  const handleSubSlugInputChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/\s+/g, "-");
    onSubSlugChange?.(normalized);
  };

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
        const editData = {
          ...postData,
          ...(slug && { slug: slug.trim() }),
          ...(subSlug !== undefined && { subSlug: subSlug.trim() || null }),
        };
        response = await fetch(`/api/posts/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editData),
        });
      } else {
        const newSlug = generateSlug(title);
        response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...postData, slug: newSlug }),
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
  }, [
    title,
    content,
    tags,
    postType,
    excerpt,
    thumbnailUrl,
    thumbnailFile,
    seriesId,
    isEditMode,
    postId,
    draftId,
    onOpenChange,
    onPublishSuccess,
    slug,
    subSlug,
  ]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isPublishing && info.offset.y > DRAG_CLOSE_THRESHOLD) {
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
            <Label htmlFor="type-long" className="cursor-pointer">
              Long Post
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="SHORT" id="type-short" />
            <Label htmlFor="type-short" className="cursor-pointer">
              Short Post
            </Label>
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

      {isEditMode && (
        <div className="slug-edit-section space-y-4 border-t pt-4">
          <div className="main-slug-field space-y-2">
            <Label className="text-sm font-medium">Main Slug</Label>
            <div className="text-xs text-muted-foreground mb-1">
              /posts/<span className="text-foreground font-medium">{slug || "your-slug"}</span>
            </div>
            <Input
              placeholder="main-slug"
              value={slug}
              onChange={(e) => handleSlugInputChange(e.target.value)}
              disabled={isPublishing}
              className="font-mono"
            />
          </div>

          {showSubSlugInput ? (
            <div className="sub-slug-field space-y-2">
              <Label className="text-sm font-medium">
                Sub Slug <span className="text-muted-foreground font-normal">(선택)</span>
              </Label>
              <div className="text-xs text-muted-foreground mb-1">
                /posts/<span className="text-foreground font-medium">{subSlug || "sub-slug"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="sub-slug (영문, 숫자, 하이픈만)"
                  value={subSlug}
                  onChange={(e) => handleSubSlugInputChange(e.target.value)}
                  disabled={isPublishing}
                  className="font-mono flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive h-9 px-3"
                  onClick={() => {
                    setShowSubSlugInput(false);
                    onSubSlugChange?.("");
                  }}
                  disabled={isPublishing}
                >
                  삭제
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                검색 최적화를 위한 보조 URL입니다. 영문 소문자, 숫자, 하이픈만 사용 가능합니다.
              </p>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowSubSlugInput(true)}
              disabled={isPublishing}
            >
              <Plus className="h-4 w-4 mr-2" />
              Sub Slug 추가
            </Button>
          )}
        </div>
      )}

      {postType === "SHORT" && socialLinkedinContent && (
        <div className="social-media-publish-section border-t border-border pt-4 mt-4 space-y-3">
          <h3 className="text-sm font-semibold">SNS 발행</h3>
          <p className="text-xs text-muted-foreground">
            아래 버튼을 클릭하면 콘텐츠가 클립보드에 복사되고, SNS 페이지가 새 창에서 열립니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (socialLinkedinContent) {
                  navigator.clipboard.writeText(socialLinkedinContent);
                  toast.success("LinkedIn 콘텐츠가 클립보드에 복사되었습니다!");
                }
                window.open("https://www.linkedin.com/in/byungsker/", "_blank");
              }}
              className="gap-2"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              LinkedIn 발행
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (socialThreadsContent && socialThreadsContent.length > 0) {
                  const combined = socialThreadsContent.join("\n\n---\n\n");
                  navigator.clipboard.writeText(combined);
                  toast.success("Threads 콘텐츠가 클립보드에 복사되었습니다!");
                }
                window.open("https://www.threads.com/@byungsker_letter", "_blank");
              }}
              className="gap-2"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.291 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142l-.126.742a12.833 12.833 0 0 0-2.787-.13c-1.21.07-2.2.415-2.865 1.002-.684.604-1.045 1.411-.99 2.216.05.879.485 1.622 1.229 2.096.682.435 1.569.636 2.488.565 1.248-.096 2.218-.543 2.88-1.329.52-.62.86-1.467.976-2.521a4.525 4.525 0 0 1 1.065.258c1.164.438 1.957 1.217 2.362 2.31.588 1.586.621 4.013-1.569 6.127-1.82 1.755-4.093 2.549-7.156 2.582z" />
              </svg>
              Threads 발행
            </Button>
          </div>
        </div>
      )}

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
              onClick={() => !isPublishing && onOpenChange(false)}
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
                <div className="space-y-6 py-4">{modalContent}</div>
              </main>

              <footer className="publish-modal-mobile-footer fixed bottom-0 left-0 right-0 flex gap-2 p-4 pb-6 bg-background border-t safe-area-bottom">
                {footerButtons}
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !isPublishing && onOpenChange(open)}>
      <DialogContent className="publish-modal sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>포스트 미리보기</DialogTitle>
        </DialogHeader>

        <div className="publish-modal-content grid gap-6 py-4">{modalContent}</div>

        <DialogFooter className="gap-1">{footerButtons}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
