"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbnailUploader } from "@/components/thumbnail-uploader";
import { SeriesSelect } from "@/components/series-select";
import { generateExcerpt } from "@/lib/excerpt";

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
  initialThumbnail?: string | null;
  initialSeriesId?: string | null;
  initialExcerpt?: string | null;
}

function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  return `${baseSlug}-${Date.now()}`;
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
  initialThumbnail,
  initialSeriesId,
  initialExcerpt,
}: PublishModalProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(initialThumbnail || null);
  const [seriesId, setSeriesId] = useState<string | null>(initialSeriesId || null);
  const [excerpt, setExcerpt] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setThumbnail(initialThumbnail || null);
      setSeriesId(initialSeriesId || null);
      setExcerpt(initialExcerpt || generateExcerpt(content, 150));
      setError(null);
    }
  }, [open, initialThumbnail, initialSeriesId, initialExcerpt, content]);

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
      const postData = {
        title: title.trim(),
        excerpt: excerpt.trim() || null,
        content,
        tags,
        published: true,
        thumbnail,
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
  }, [title, content, tags, excerpt, thumbnail, seriesId, isEditMode, postId, draftId, onOpenChange, onPublishSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="publish-modal sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>포스트 미리보기</DialogTitle>
        </DialogHeader>

        <div className="publish-modal-content grid gap-6 py-4 sm:grid-cols-2">
          <div className="thumbnail-section">
            <ThumbnailUploader value={thumbnail} onChange={setThumbnail} disabled={isPublishing} />
            <p className="mt-2 text-xs text-muted-foreground">
              썸네일을 업로드하면 포스트 목록에서 카드 형태로 표시됩니다.
            </p>
          </div>

          <div className="settings-section space-y-6">
            <div className="excerpt-field space-y-2">
              <label className="text-sm font-medium">설명</label>
              <Textarea
                placeholder="포스트 설명을 입력하세요..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                disabled={isPublishing}
                rows={4}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">{excerpt.length}/200</p>
            </div>

            <SeriesSelect value={seriesId} onChange={setSeriesId} disabled={isPublishing} />
          </div>
        </div>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPublishing}>
            취소
          </Button>
          <Button type="button" onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? (isEditMode ? "수정 중..." : "발행 중...") : isEditMode ? "수정하기" : "발행하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
