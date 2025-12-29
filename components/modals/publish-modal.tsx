"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ThumbnailUploader } from "@/components/editor/thumbnail-uploader";
import { SeriesSelect } from "@/components/editor/series-select";
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
  initialType?: "LONG" | "SHORT";
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
  initialType,
}: PublishModalProps) {
  const [postType, setPostType] = useState<"LONG" | "SHORT">(initialType || "LONG");
  const [thumbnail, setThumbnail] = useState<string | null>(initialThumbnail || null);
  const [seriesId, setSeriesId] = useState<string | null>(initialSeriesId || null);
  const [excerpt, setExcerpt] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPostType(initialType || "LONG");
      setThumbnail(initialThumbnail || null);
      setSeriesId(initialSeriesId || null);
      setExcerpt(initialExcerpt || generateExcerpt(content, 150));
      setError(null);
    }
  }, [open, initialType, initialThumbnail, initialSeriesId, initialExcerpt, content]);

  // SHORT 선택 시 썸네일 초기화
  useEffect(() => {
    if (postType === "SHORT") {
      setThumbnail(null);
    }
  }, [postType]);

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
        type: postType,
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
  }, [title, content, tags, postType, excerpt, thumbnail, seriesId, isEditMode, postId, draftId, onOpenChange, onPublishSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="publish-modal sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>포스트 미리보기</DialogTitle>
        </DialogHeader>

        <div className="publish-modal-content grid gap-6 py-4">
          <div className="post-type-section space-y-3">
            <Label className="text-sm font-medium">글 유형</Label>
            <RadioGroup
              value={postType}
              onValueChange={(value) => setPostType(value as "LONG" | "SHORT")}
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

          <div className="grid gap-6 sm:grid-cols-2">
            {postType === "LONG" && (
              <div className="thumbnail-section">
                <ThumbnailUploader value={thumbnail} onChange={setThumbnail} disabled={isPublishing} />
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
