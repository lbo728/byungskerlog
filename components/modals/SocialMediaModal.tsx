"use client";

import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { Loader2, Sparkles, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSocialMediaConvert } from "@/hooks/useSocialMediaConvert";

interface SocialMediaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  originalContent: string;
  onSave: (linkedin: string, threads: string[]) => void;
}

const LINKEDIN_LIMIT = 3000;
const THREADS_LIMIT = 500;

export function SocialMediaModal({ open, onOpenChange, title, originalContent, onSave }: SocialMediaModalProps) {
  const [activeTab, setActiveTab] = useState<"original" | "linkedin" | "threads">("original");
  const [linkedinContent, setLinkedinContent] = useState("");
  const [threadsContent, setThreadsContent] = useState<string[]>([""]);
  const [isConverted, setIsConverted] = useState(false);

  const convertMutation = useSocialMediaConvert();

  useEffect(() => {
    if (open && !isConverted && originalContent) {
      handleAutoConvert();
    }
  }, [open, isConverted, originalContent]);

  const handleAutoConvert = useCallback(async () => {
    try {
      const linkedinResult = await convertMutation.mutateAsync({
        content: originalContent,
        title,
        platform: "linkedin",
      });

      if (linkedinResult.data.linkedin) {
        setLinkedinContent(linkedinResult.data.linkedin);
      }

      const threadsResult = await convertMutation.mutateAsync({
        content: originalContent,
        title,
        platform: "threads",
      });

      if (threadsResult.data.threads && threadsResult.data.threads.length > 0) {
        setThreadsContent(threadsResult.data.threads);
      }

      setIsConverted(true);
      toast.success("AI 변환이 완료되었습니다!");
    } catch {
      toast.error("AI 변환에 실패했습니다. 수동으로 작성해주세요.");
      setIsConverted(true);
    }
  }, [originalContent, title, convertMutation]);

  const handleRegenerate = useCallback(
    async (platform: "linkedin" | "threads") => {
      try {
        const result = await convertMutation.mutateAsync({
          content: originalContent,
          title,
          platform,
        });

        if (platform === "linkedin" && result.data.linkedin) {
          setLinkedinContent(result.data.linkedin);
          toast.success("LinkedIn 콘텐츠가 재생성되었습니다!");
        } else if (platform === "threads" && result.data.threads) {
          setThreadsContent(result.data.threads);
          toast.success("Threads 콘텐츠가 재생성되었습니다!");
        }
      } catch {
        toast.error("재생성에 실패했습니다.");
      }
    },
    [originalContent, title, convertMutation]
  );

  const handleAddThreadsPost = () => {
    setThreadsContent([...threadsContent, ""]);
  };

  const handleRemoveThreadsPost = (index: number) => {
    if (threadsContent.length === 1) {
      toast.error("최소 1개의 포스트가 필요합니다.");
      return;
    }
    setThreadsContent(threadsContent.filter((_, i) => i !== index));
  };

  const handleThreadsContentChange = (index: number, value: string) => {
    const newContent = [...threadsContent];
    newContent[index] = value;
    setThreadsContent(newContent);
  };

  const handleSave = () => {
    if (!linkedinContent.trim()) {
      toast.error("LinkedIn 콘텐츠를 입력해주세요.");
      return;
    }

    if (threadsContent.some((post) => !post.trim())) {
      toast.error("모든 Threads 포스트를 입력해주세요.");
      return;
    }

    onSave(linkedinContent, threadsContent);
    onOpenChange(false);
  };

  const handleClose = () => {
    setIsConverted(false);
    setLinkedinContent("");
    setThreadsContent([""]);
    setActiveTab("original");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="social-media-modal sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            SNS 포맷 편집
          </DialogTitle>
        </DialogHeader>

        {convertMutation.isPending && !isConverted ? (
          <div className="ai-loading flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">AI가 콘텐츠를 변환하고 있습니다...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="original">원본</TabsTrigger>
              <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
              <TabsTrigger value="threads">Threads</TabsTrigger>
            </TabsList>

            <TabsContent value="original" className="original-tab-content space-y-4 mt-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">제목: {title}</p>
              </div>
              <Textarea value={originalContent} readOnly className="min-h-[400px] font-mono text-sm bg-muted/30" />
            </TabsContent>

            <TabsContent value="linkedin" className="linkedin-tab-content space-y-4 mt-4">
              <div className="linkedin-header flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <span className={linkedinContent.length > LINKEDIN_LIMIT ? "text-destructive font-semibold" : ""}>
                    {linkedinContent.length}
                  </span>{" "}
                  / {LINKEDIN_LIMIT}자
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegenerate("linkedin")}
                  disabled={convertMutation.isPending}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  재생성
                </Button>
              </div>
              <Textarea
                value={linkedinContent}
                onChange={(e) => setLinkedinContent(e.target.value)}
                placeholder="LinkedIn 포스트 내용을 입력하세요..."
                className="min-h-[400px]"
                maxLength={LINKEDIN_LIMIT}
              />
            </TabsContent>

            <TabsContent value="threads" className="threads-tab-content space-y-4 mt-4">
              <div className="threads-header flex items-center justify-between">
                <div className="text-sm text-muted-foreground">총 {threadsContent.length}개 포스트</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerate("threads")}
                    disabled={convertMutation.isPending}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    재생성
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleAddThreadsPost} className="gap-2">
                    <Plus className="h-4 w-4" />
                    포스트 추가
                  </Button>
                </div>
              </div>

              <div className="threads-posts-list space-y-4 max-h-[400px] overflow-y-auto">
                {threadsContent.map((post, index) => (
                  <div key={index} className="threads-post-item border border-border rounded-lg p-4 space-y-2">
                    <div className="threads-post-header flex items-center justify-between">
                      <span className="text-sm font-medium">포스트 {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm ${post.length > THREADS_LIMIT ? "text-destructive font-semibold" : "text-muted-foreground"}`}
                        >
                          {post.length} / {THREADS_LIMIT}자
                        </span>
                        {threadsContent.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveThreadsPost(index)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <Textarea
                      value={post}
                      onChange={(e) => handleThreadsContentChange(index, e.target.value)}
                      placeholder={`${index + 1}번째 포스트 내용...`}
                      className="min-h-[120px]"
                      maxLength={THREADS_LIMIT}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={convertMutation.isPending}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={convertMutation.isPending}>
            저장하고 계속
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
