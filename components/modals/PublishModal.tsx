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
import { X, Plus, ArrowLeft, Copy, Sparkles, Maximize2, Minimize2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { generateSlug } from "@/lib/utils/slug";
import { toast } from "sonner";
import { useSocialMediaConvert } from "@/hooks/useSocialMediaConvert";
import { cn } from "@/lib/utils";

const MAX_THUMBNAIL_SIZE = 500 * 1024;
const DRAG_CLOSE_THRESHOLD = 100;
const THREADS_CHAR_LIMIT = 500;
const LINKEDIN_CHAR_LIMIT = 3000;

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

function splitTextByCharLimit(text: string, limit: number): string[] {
  const result: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= limit) {
      result.push(remaining);
      break;
    }

    let splitIndex = remaining.lastIndexOf(" ", limit);
    if (splitIndex === -1 || splitIndex < limit * 0.5) {
      splitIndex = limit;
    }

    result.push(remaining.slice(0, splitIndex).trim());
    remaining = remaining.slice(splitIndex).trim();
  }

  return result;
}

function formatSnsContent(title: string, content: string): string {
  return `<${title}>\n\n${content}`;
}

function formatCount(count: number): string {
  return count.toLocaleString();
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
}: PublishModalProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const [showSubSlugInput, setShowSubSlugInput] = useState(!!subSlug);
  const isMobile = useIsMobile();

  const [step, setStep] = useState<1 | 2>(1);
  const [linkedinContent, setLinkedinContent] = useState("");
  const [threadsContent, setThreadsContent] = useState<string[]>([""]);
  const [isFullView, setIsFullView] = useState(false);
  const [snsTab, setSnsTab] = useState<"linkedin" | "threads">("linkedin");

  const { mutate: convertWithAI, isPending: isAILoading } = useSocialMediaConvert();

  useEffect(() => {
    if (open) {
      setStep(1);
      setIsFullView(false);
      setSnsTab("linkedin");
    }
  }, [open]);

  const initializeSnsContent = useCallback(() => {
    const formattedContent = formatSnsContent(title, content);
    setLinkedinContent(formattedContent);
    const splitThreads = splitTextByCharLimit(formattedContent, THREADS_CHAR_LIMIT);
    setThreadsContent(splitThreads.length > 0 ? splitThreads : [""]);
  }, [title, content]);

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
      initializeSnsContent();
      setStep(2);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setIsFullView(false);
  };

  const handleAIImprove = (platform: "linkedin" | "threads") => {
    convertWithAI(
      { title, content, platform },
      {
        onSuccess: (response) => {
          if (platform === "linkedin" && response.data.linkedin) {
            setLinkedinContent(response.data.linkedin);
          } else if (platform === "threads" && response.data.threads) {
            setThreadsContent(response.data.threads);
          }
          toast.success(`AI가 ${platform === "linkedin" ? "LinkedIn" : "Threads"} 콘텐츠를 개선했습니다.`);
        },
        onError: () => {
          toast.error("AI 변환에 실패했습니다. 다시 시도해주세요.");
        },
      }
    );
  };

  const handleCopyLinkedin = () => {
    navigator.clipboard.writeText(linkedinContent);
    toast.success("LinkedIn 콘텐츠가 복사되었습니다.");
  };

  const handleCopyThreadsPost = (index: number) => {
    navigator.clipboard.writeText(threadsContent[index]);
    toast.success(`Threads 포스트 ${index + 1}이 복사되었습니다.`);
  };

  const handleOpenLinkedin = () => {
    handleCopyLinkedin();
    window.open("https://www.linkedin.com/in/byungsker/overlay/create-post/", "_blank");
  };

  const handleOpenThreads = () => {
    navigator.clipboard.writeText(threadsContent[0] || "");
    toast.success("첫 번째 Threads 포스트가 복사되었습니다.");
    window.open("https://www.threads.com/@byungsker_letter", "_blank");
  };

  const handleThreadsContentChange = (index: number, value: string) => {
    const newContent = [...threadsContent];
    newContent[index] = value;
    setThreadsContent(newContent);
  };

  const handleAddThreadsPost = () => {
    setThreadsContent([...threadsContent, ""]);
  };

  const handleRemoveThreadsPost = (index: number) => {
    if (threadsContent.length > 1) {
      setThreadsContent(threadsContent.filter((_, i) => i !== index));
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
        ...(postType === "SHORT" && {
          linkedinContent: linkedinContent || null,
          threadsContent: threadsContent.filter((t) => t.trim()),
        }),
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
    linkedinContent,
    threadsContent,
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

  const LinkedInIcon = ({ className }: { className?: string }) => (
    <svg className={cn("h-4 w-4", className)} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );

  const ThreadsIcon = ({ className }: { className?: string }) => (
    <svg className={cn("h-4 w-4", className)} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.291 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142l-.126.742a12.833 12.833 0 0 0-2.787-.13c-1.21.07-2.2.415-2.865 1.002-.684.604-1.045 1.411-.99 2.216.05.879.485 1.622 1.229 2.096.682.435 1.569.636 2.488.565 1.248-.096 2.218-.543 2.88-1.329.52-.62.86-1.467.976-2.521a4.525 4.525 0 0 1 1.065.258c1.164.438 1.957 1.217 2.362 2.31.588 1.586.621 4.013-1.569 6.127-1.82 1.755-4.093 2.549-7.156 2.582z" />
    </svg>
  );

  const step1Content = (
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
            <p className="text-xs text-muted-foreground text-right">{formatCount(excerpt.length)}/200</p>
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

      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </>
  );

  const linkedinTab = (
    <div className="linkedin-tab-content space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleAIImprove("linkedin")}
            disabled={isAILoading}
            className="h-8 px-3 text-xs gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI로 개선하기
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyLinkedin}
            className="h-8 px-3 text-xs gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            복사
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOpenLinkedin}
            className="h-8 px-3 text-xs gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            LinkedIn에 포스트
          </Button>
        </div>
      </div>
      <Textarea
        value={linkedinContent}
        onChange={(e) => setLinkedinContent(e.target.value)}
        placeholder="LinkedIn 콘텐츠..."
        className={cn("resize-none transition-all duration-200", isFullView ? "h-[calc(100dvh-280px)]" : "h-[300px]")}
        disabled={isPublishing || isAILoading}
      />
      <p
        className={cn(
          "text-xs text-right",
          linkedinContent.length > LINKEDIN_CHAR_LIMIT ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {formatCount(linkedinContent.length)}/{formatCount(LINKEDIN_CHAR_LIMIT)}
      </p>
    </div>
  );

  const threadsTab = (
    <div className="threads-tab-content space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{threadsContent.length}개 포스트</span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleAIImprove("threads")}
            disabled={isAILoading}
            className="h-8 px-3 text-xs gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI로 개선하기
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOpenThreads}
            className="h-8 px-3 text-xs gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Threads에 포스트
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "threads-posts space-y-4 overflow-y-auto",
          isFullView ? "max-h-[calc(100dvh-320px)]" : "max-h-[400px]"
        )}
      >
        {threadsContent.map((threadPost, index) => (
          <div key={index} className="thread-post-item space-y-2 p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">포스트 {index + 1}</span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyThreadsPost(index)}
                  className="h-7 px-2 text-xs gap-1"
                >
                  <Copy className="h-3 w-3" />
                  복사
                </Button>
                {threadsContent.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveThreadsPost(index)}
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                  >
                    삭제
                  </Button>
                )}
              </div>
            </div>
            <Textarea
              value={threadPost}
              onChange={(e) => handleThreadsContentChange(index, e.target.value)}
              placeholder={`Threads 포스트 ${index + 1}...`}
              className="h-[120px] resize-none"
              disabled={isPublishing || isAILoading}
            />
            <p
              className={cn(
                "text-xs text-right",
                threadPost.length > THREADS_CHAR_LIMIT ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {formatCount(threadPost.length)}/{formatCount(THREADS_CHAR_LIMIT)}
            </p>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddThreadsPost}
        className="w-full"
        disabled={isPublishing}
      >
        <Plus className="h-4 w-4 mr-2" />
        포스트 추가
      </Button>
    </div>
  );

  const step2Content = (
    <div className="sns-edit-step space-y-4">
      <div className="sns-edit-header flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={handleBackToStep1} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          뒤로가기
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsFullView(!isFullView)} className="gap-2">
          {isFullView ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          {isFullView ? "축소" : "전체보기"}
        </Button>
      </div>

      <div className="sns-tabs flex border-b">
        <button
          type="button"
          onClick={() => setSnsTab("linkedin")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            snsTab === "linkedin"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <LinkedInIcon />
          LinkedIn
        </button>
        <button
          type="button"
          onClick={() => setSnsTab("threads")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            snsTab === "threads"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <ThreadsIcon />
          Threads
        </button>
      </div>

      {snsTab === "linkedin" ? linkedinTab : threadsTab}

      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </div>
  );

  const modalContent = step === 1 ? step1Content : step2Content;

  const step1FooterButtons = (
    <>
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPublishing}>
        취소
      </Button>
      <Button type="button" onClick={handlePublish} disabled={isPublishing}>
        {isPublishing ? (isEditMode ? "수정 중..." : "발행 중...") : isEditMode ? "수정하기" : "발행하기"}
      </Button>
    </>
  );

  const step2FooterButtons = (
    <>
      <Button type="button" variant="outline" onClick={handleBackToStep1} disabled={isPublishing}>
        이전
      </Button>
      <Button type="button" onClick={handlePublish} disabled={isPublishing}>
        {isPublishing ? (isEditMode ? "수정 중..." : "발행 중...") : isEditMode ? "수정하기" : "발행하기"}
      </Button>
    </>
  );

  const footerButtons = step === 1 ? step1FooterButtons : step2FooterButtons;

  if (isMobile || isFullView) {
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
              onClick={() => !isPublishing && !isFullView && onOpenChange(false)}
            />
            <motion.div
              className="publish-modal-mobile fixed inset-0 z-50 flex flex-col bg-background"
              style={{ height: "100dvh", width: "100dvw" }}
              initial={{ y: isMobile ? "100%" : 0, opacity: isMobile ? 1 : 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: isMobile ? "100%" : 0, opacity: isMobile ? 1 : 0 }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 300,
              }}
              drag={isMobile && !isFullView ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
            >
              <header className="publish-modal-mobile-header flex items-center justify-between px-4 py-4 border-b safe-area-top">
                <div className="w-10" />
                {isMobile && !isFullView && (
                  <div className="publish-modal-drag-handle mx-auto">
                    <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                  </div>
                )}
                {isFullView && (
                  <h2 className="text-lg font-semibold flex-1 text-center">
                    {step === 1 ? "포스트 미리보기" : "SNS 포맷 편집"}
                  </h2>
                )}
                <button
                  type="button"
                  onClick={() => (isFullView ? setIsFullView(false) : onOpenChange(false))}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                  disabled={isPublishing}
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              {isMobile && !isFullView && (
                <div className="publish-modal-mobile-title px-4 pt-4 pb-2">
                  <h2 className="text-lg font-semibold">{step === 1 ? "포스트 미리보기" : "SNS 포맷 편집"}</h2>
                </div>
              )}

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
          <DialogTitle>{step === 1 ? "포스트 미리보기" : "SNS 포맷 편집"}</DialogTitle>
        </DialogHeader>

        <div className="publish-modal-content grid gap-6 py-4">{modalContent}</div>

        <DialogFooter className="gap-1">{footerButtons}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
