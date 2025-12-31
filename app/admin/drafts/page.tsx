"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDrafts } from "@/hooks/useDrafts";
import { useDeleteDraft } from "@/hooks/useDraftMutations";
import type { Draft } from "@/lib/types/post";

export default function AdminDraftsPage() {
  useUser({ or: "redirect" });
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<Draft | null>(null);

  const { data: drafts = [], isLoading } = useDrafts();
  const deleteDraftMutation = useDeleteDraft();

  const handleDeleteClick = (draft: Draft) => {
    setDraftToDelete(draft);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!draftToDelete) return;

    try {
      await deleteDraftMutation.mutateAsync(draftToDelete.id);
      toast.success("임시저장이 삭제되었습니다.");
      setDeleteDialogOpen(false);
      setDraftToDelete(null);
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPreviewText = (content: string) => {
    const text = content.replace(/[#*`>\[\]()-]/g, "").trim();
    return text.length > 100 ? text.slice(0, 100) + "..." : text;
  };

  return (
    <div className="admin-drafts-page min-h-screen bg-background">
      <header className="admin-header sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/posts")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />글 관리
            </Button>
            <h1 className="text-lg font-semibold">임시저장</h1>
          </div>
          <Button variant="default" size="sm" onClick={() => router.push("/admin/write")} className="gap-2">
            <Plus className="h-4 w-4" />새 글 작성
          </Button>
        </div>
      </header>

      <div className="drafts-content container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">임시저장된 글이 없습니다.</p>
            <Button onClick={() => router.push("/admin/write")}>새 글 작성하기</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="draft-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="draft-card-content flex-1 min-w-0">
                    <h2 className="text-xl font-semibold truncate mb-2">{draft.title || "제목 없음"}</h2>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {getPreviewText(draft.content) || "내용 없음"}
                    </p>
                    <div className="draft-card-meta flex items-center gap-4 text-xs text-muted-foreground">
                      <span>마지막 수정: {formatDate(draft.updatedAt)}</span>
                      {draft.tags.length > 0 && (
                        <div className="flex gap-2">
                          {draft.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-0.5 bg-primary/10 text-primary rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="draft-card-actions flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => router.push(`/admin/write?draft=${draft.id}`)}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      이어쓰기
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(draft)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{draftToDelete?.title || "제목 없음"}&rdquo; 임시저장이 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDraftMutation.isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteDraftMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDraftMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
