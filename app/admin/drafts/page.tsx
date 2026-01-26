"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Pencil, Trash2, Plus, Check } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { useDrafts } from "@/hooks/useDrafts";
import { useDeleteDraft, useDeleteMultipleDrafts, useDeleteAllDrafts } from "@/hooks/useDraftMutations";
import type { Draft } from "@/lib/types/post";

type DeleteDialogType = "single" | "selected" | "all";

export default function AdminDraftsPage() {
  useUser({ or: "redirect" });
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDialogType, setDeleteDialogType] = useState<DeleteDialogType>("single");
  const [draftToDelete, setDraftToDelete] = useState<Draft | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: drafts = [], isLoading } = useDrafts();
  const deleteDraftMutation = useDeleteDraft();
  const deleteMultipleMutation = useDeleteMultipleDrafts();
  const deleteAllMutation = useDeleteAllDrafts();

  const isAllSelected = useMemo(
    () => drafts.length > 0 && selectedIds.size === drafts.length,
    [drafts.length, selectedIds.size]
  );

  const isSomeSelected = useMemo(() => selectedIds.size > 0, [selectedIds.size]);

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(drafts.map((d) => d.id)));
    }
  }, [isAllSelected, drafts]);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDeleteClick = (draft: Draft) => {
    setDraftToDelete(draft);
    setDeleteDialogType("single");
    setDeleteDialogOpen(true);
  };

  const handleSelectedDeleteClick = () => {
    setDeleteDialogType("selected");
    setDeleteDialogOpen(true);
  };

  const handleDeleteAllClick = () => {
    setDeleteDialogType("all");
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialogType === "single" && draftToDelete) {
        await deleteDraftMutation.mutateAsync(draftToDelete.id);
        toast.success("임시저장이 삭제되었습니다.");
      } else if (deleteDialogType === "selected") {
        const ids = Array.from(selectedIds);
        await deleteMultipleMutation.mutateAsync(ids);
        toast.success(`${ids.length}개의 임시저장이 삭제되었습니다.`);
        setSelectedIds(new Set());
      } else if (deleteDialogType === "all") {
        await deleteAllMutation.mutateAsync();
        toast.success("모든 임시저장이 삭제되었습니다.");
        setSelectedIds(new Set());
      }
      setDeleteDialogOpen(false);
      setDraftToDelete(null);
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  };

  const isDeleting = deleteDraftMutation.isPending || deleteMultipleMutation.isPending || deleteAllMutation.isPending;

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
            {drafts.length > 0 && <span className="text-sm text-muted-foreground">({drafts.length}개)</span>}
          </div>
          <div className="flex items-center gap-2">
            {isSomeSelected && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectedDeleteClick}
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                선택 삭제 ({selectedIds.size})
              </Button>
            )}
            {drafts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteAllClick}
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                모두 삭제
              </Button>
            )}
            <Button variant="default" size="sm" onClick={() => router.push("/admin/write")} className="gap-2">
              <Plus className="h-4 w-4" />새 글 작성
            </Button>
          </div>
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
            <div className="select-all-header flex items-center gap-3 px-6 py-2 border-b border-border">
              <button
                type="button"
                onClick={handleSelectAll}
                className="checkbox-btn flex items-center justify-center w-5 h-5 rounded border border-border hover:border-primary transition-colors"
                style={{ backgroundColor: isAllSelected ? "var(--primary)" : "transparent" }}
                aria-label={isAllSelected ? "모두 선택 해제" : "모두 선택"}
              >
                {isAllSelected && <Check className="h-3 w-3 text-primary-foreground" />}
              </button>
              <span className="text-sm text-muted-foreground">
                {isSomeSelected ? `${selectedIds.size}개 선택됨` : "전체 선택"}
              </span>
            </div>

            {drafts.map((draft) => {
              const isSelected = selectedIds.has(draft.id);
              return (
                <div
                  key={draft.id}
                  className={`draft-card border rounded-lg p-6 transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() => handleSelectOne(draft.id)}
                      className="checkbox-btn flex items-center justify-center w-5 h-5 rounded border border-border hover:border-primary transition-colors mt-1 flex-shrink-0"
                      style={{ backgroundColor: isSelected ? "var(--primary)" : "transparent" }}
                      aria-label={isSelected ? "선택 해제" : "선택"}
                    >
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </button>
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
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialogType === "single" && (
                <>&ldquo;{draftToDelete?.title || "제목 없음"}&rdquo; 임시저장이 영구적으로 삭제됩니다.</>
              )}
              {deleteDialogType === "selected" && <>선택한 {selectedIds.size}개의 임시저장이 영구적으로 삭제됩니다.</>}
              {deleteDialogType === "all" && (
                <>모든 임시저장({drafts.length}개)이 영구적으로 삭제됩니다. 이 작업은 취소할 수 없습니다.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
