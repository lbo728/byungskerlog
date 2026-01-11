"use client";

import { useState } from "react";
import { Brain, BookOpen, FileText, Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
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
import { cn } from "@/lib/utils";
import {
  useKnowledgePresets,
  useCreatePreset,
  useUpdatePreset,
  useDeletePreset,
  useCreateReference,
  useUpdateReference,
  useDeleteReference,
} from "@/hooks/useKnowledgePresets";
import type { AIKnowledgePresetWithReferences, AIKnowledgeReference } from "@/lib/types/ai-knowledge";

export function KnowledgePresetsTab() {
  const { data: presets = [], isLoading } = useKnowledgePresets();
  const createPresetMutation = useCreatePreset();
  const updatePresetMutation = useUpdatePreset();
  const deletePresetMutation = useDeletePreset();
  const createReferenceMutation = useCreateReference();
  const updateReferenceMutation = useUpdateReference();
  const deleteReferenceMutation = useDeleteReference();

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [expandedPresetId, setExpandedPresetId] = useState<string | null>(null);

  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetInstruction, setNewPresetInstruction] = useState("");

  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingPresetName, setEditingPresetName] = useState("");
  const [editingPresetInstruction, setEditingPresetInstruction] = useState("");

  const [newRefTitle, setNewRefTitle] = useState("");
  const [newRefContent, setNewRefContent] = useState("");

  const [editingRefId, setEditingRefId] = useState<string | null>(null);
  const [editingRefTitle, setEditingRefTitle] = useState("");
  const [editingRefContent, setEditingRefContent] = useState("");

  const [deletePresetDialogOpen, setDeletePresetDialogOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<AIKnowledgePresetWithReferences | null>(null);

  const [deleteRefDialogOpen, setDeleteRefDialogOpen] = useState(false);
  const [refToDelete, setRefToDelete] = useState<{ presetId: string; ref: AIKnowledgeReference } | null>(null);

  const selectedPreset = presets.find((p) => p.id === selectedPresetId);

  const handleCreatePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim() || !newPresetInstruction.trim()) return;

    createPresetMutation.mutate(
      { name: newPresetName.trim(), instruction: newPresetInstruction.trim() },
      {
        onSuccess: () => {
          setNewPresetName("");
          setNewPresetInstruction("");
        },
      }
    );
  };

  const handleStartEditPreset = (preset: AIKnowledgePresetWithReferences) => {
    setEditingPresetId(preset.id);
    setEditingPresetName(preset.name);
    setEditingPresetInstruction(preset.instruction);
  };

  const handleCancelEditPreset = () => {
    setEditingPresetId(null);
    setEditingPresetName("");
    setEditingPresetInstruction("");
  };

  const handleUpdatePreset = () => {
    if (!editingPresetId || !editingPresetName.trim() || !editingPresetInstruction.trim()) return;

    updatePresetMutation.mutate(
      {
        id: editingPresetId,
        data: { name: editingPresetName.trim(), instruction: editingPresetInstruction.trim() },
      },
      {
        onSuccess: () => {
          handleCancelEditPreset();
        },
      }
    );
  };

  const handleDeletePresetClick = (preset: AIKnowledgePresetWithReferences) => {
    setPresetToDelete(preset);
    setDeletePresetDialogOpen(true);
  };

  const handleDeletePresetConfirm = () => {
    if (!presetToDelete) return;

    deletePresetMutation.mutate(presetToDelete.id, {
      onSuccess: () => {
        if (selectedPresetId === presetToDelete.id) {
          setSelectedPresetId(null);
        }
        setDeletePresetDialogOpen(false);
        setPresetToDelete(null);
      },
    });
  };

  const handleSelectPreset = (presetId: string) => {
    if (selectedPresetId === presetId) {
      setSelectedPresetId(null);
      setExpandedPresetId(null);
    } else {
      setSelectedPresetId(presetId);
      setExpandedPresetId(presetId);
    }
    setEditingPresetId(null);
    setEditingRefId(null);
  };

  const toggleExpandPreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPresetId(expandedPresetId === presetId ? null : presetId);
  };

  const handleCreateReference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPresetId || !newRefTitle.trim() || !newRefContent.trim()) return;

    createReferenceMutation.mutate(
      {
        presetId: selectedPresetId,
        data: { title: newRefTitle.trim(), content: newRefContent.trim() },
      },
      {
        onSuccess: () => {
          setNewRefTitle("");
          setNewRefContent("");
        },
      }
    );
  };

  const handleStartEditRef = (ref: AIKnowledgeReference) => {
    setEditingRefId(ref.id);
    setEditingRefTitle(ref.title);
    setEditingRefContent(ref.content);
  };

  const handleCancelEditRef = () => {
    setEditingRefId(null);
    setEditingRefTitle("");
    setEditingRefContent("");
  };

  const handleUpdateRef = (presetId: string) => {
    if (!editingRefId || !editingRefTitle.trim() || !editingRefContent.trim()) return;

    updateReferenceMutation.mutate(
      {
        presetId,
        refId: editingRefId,
        data: { title: editingRefTitle.trim(), content: editingRefContent.trim() },
      },
      {
        onSuccess: () => {
          handleCancelEditRef();
        },
      }
    );
  };

  const handleDeleteRefClick = (presetId: string, ref: AIKnowledgeReference) => {
    setRefToDelete({ presetId, ref });
    setDeleteRefDialogOpen(true);
  };

  const handleDeleteRefConfirm = () => {
    if (!refToDelete) return;

    deleteReferenceMutation.mutate(
      { presetId: refToDelete.presetId, refId: refToDelete.ref.id },
      {
        onSuccess: () => {
          setDeleteRefDialogOpen(false);
          setRefToDelete(null);
        },
      }
    );
  };

  const formatLastUsed = (date: Date | null) => {
    if (!date) return "사용 기록 없음";
    const d = new Date(date);
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="knowledge-presets-content container mx-auto px-4 py-8 max-w-4xl">
      <div className="mobile-notice md:hidden mb-6 p-4 border border-border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground text-center">추가 및 수정은 데스크탑에서 진행해주세요.</p>
      </div>

      <form
        onSubmit={handleCreatePreset}
        className="add-preset-form hidden md:block mb-8 p-4 border border-border rounded-lg"
      >
        <h2 className="add-preset-title text-sm font-semibold mb-4 flex items-center gap-2">
          <Brain className="h-4 w-4" />새 프리셋 추가
        </h2>
        <div className="space-y-3 mb-3">
          <Input placeholder="프리셋 이름" value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} />
          <Textarea
            placeholder="지침 내용을 입력하세요..."
            value={newPresetInstruction}
            onChange={(e) => setNewPresetInstruction(e.target.value)}
            className="min-h-[120px]"
          />
        </div>
        <Button
          type="submit"
          disabled={createPresetMutation.isPending || !newPresetName.trim() || !newPresetInstruction.trim()}
        >
          <Plus className="h-4 w-4 mr-2" />
          추가
        </Button>
      </form>

      {isLoading ? (
        <div className="loading-state text-center py-12">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : presets.length === 0 ? (
        <div className="empty-state text-center py-12">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">등록된 프리셋이 없습니다.</p>
        </div>
      ) : (
        <div className="presets-list space-y-4">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className={cn(
                "preset-card border border-border rounded-lg transition-colors",
                selectedPresetId === preset.id && "border-primary/50 bg-muted/30"
              )}
            >
              <div className="preset-header p-4 cursor-pointer" onClick={() => handleSelectPreset(preset.id)}>
                {editingPresetId === preset.id ? (
                  <div className="edit-preset-form space-y-3" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editingPresetName}
                      onChange={(e) => setEditingPresetName(e.target.value)}
                      placeholder="프리셋 이름"
                      autoFocus
                    />
                    <Textarea
                      value={editingPresetInstruction}
                      onChange={(e) => setEditingPresetInstruction(e.target.value)}
                      placeholder="지침"
                      className="min-h-[200px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleUpdatePreset} disabled={updatePresetMutation.isPending}>
                        <Check className="h-4 w-4 mr-1" />
                        저장
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEditPreset}>
                        <X className="h-4 w-4 mr-1" />
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="preset-info flex items-start justify-between">
                    <div className="preset-details flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Brain className="h-4 w-4 text-muted-foreground shrink-0" />
                        <h3 className="font-medium truncate">{preset.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{preset.instruction}</p>
                      <div className="preset-meta flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {preset.references.length}개 참고 컨텐츠
                        </span>
                        <span>{formatLastUsed(preset.lastUsedAt)}</span>
                      </div>
                    </div>
                    <div className="preset-actions flex items-center gap-1 ml-4" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEditPreset(preset)}
                        className="hidden md:flex"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePresetClick(preset)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => toggleExpandPreset(preset.id, e)}>
                        {expandedPresetId === preset.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {expandedPresetId === preset.id && editingPresetId !== preset.id && (
                <div className="references-section border-t border-border p-4">
                  <h4 className="references-title text-sm font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    참고 컨텐츠
                  </h4>

                  <form
                    onSubmit={handleCreateReference}
                    className="add-reference-form hidden md:block mb-4 p-3 border border-dashed border-border rounded-lg bg-muted/20"
                  >
                    <div className="space-y-2 mb-2">
                      <Input
                        placeholder="제목"
                        value={selectedPresetId === preset.id ? newRefTitle : ""}
                        onChange={(e) => {
                          setSelectedPresetId(preset.id);
                          setNewRefTitle(e.target.value);
                        }}
                        onFocus={() => setSelectedPresetId(preset.id)}
                      />
                      <Textarea
                        placeholder="내용"
                        value={selectedPresetId === preset.id ? newRefContent : ""}
                        onChange={(e) => {
                          setSelectedPresetId(preset.id);
                          setNewRefContent(e.target.value);
                        }}
                        onFocus={() => setSelectedPresetId(preset.id)}
                        className="min-h-[80px]"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={
                        createReferenceMutation.isPending ||
                        selectedPresetId !== preset.id ||
                        !newRefTitle.trim() ||
                        !newRefContent.trim()
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      추가
                    </Button>
                  </form>

                  {preset.references.length === 0 ? (
                    <div className="empty-references text-center py-6">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">참고 컨텐츠가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="references-list space-y-3">
                      {preset.references.map((ref) => (
                        <div key={ref.id} className="reference-item border border-border rounded-lg p-3">
                          {editingRefId === ref.id ? (
                            <div className="edit-reference-form space-y-2">
                              <Input
                                value={editingRefTitle}
                                onChange={(e) => setEditingRefTitle(e.target.value)}
                                placeholder="제목"
                                autoFocus
                              />
                              <Textarea
                                value={editingRefContent}
                                onChange={(e) => setEditingRefContent(e.target.value)}
                                placeholder="내용"
                                className="min-h-[100px]"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateRef(preset.id)}
                                  disabled={updateReferenceMutation.isPending}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  저장
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleCancelEditRef}>
                                  <X className="h-4 w-4 mr-1" />
                                  취소
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="reference-content">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="reference-title font-medium text-sm flex items-center gap-2">
                                  <FileText className="h-3 w-3 text-muted-foreground" />
                                  {ref.title}
                                </h5>
                                <div className="reference-actions flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStartEditRef(ref)}
                                    className="hidden md:flex h-7 w-7 p-0"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteRefClick(preset.id, ref)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="reference-text text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                                {ref.content}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={deletePresetDialogOpen} onOpenChange={setDeletePresetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프리셋을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{presetToDelete?.name}&rdquo; 프리셋과 모든 참고 컨텐츠가 영구적으로 삭제됩니다. 이 작업은 되돌릴
              수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePresetMutation.isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePresetConfirm}
              disabled={deletePresetMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePresetMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteRefDialogOpen} onOpenChange={setDeleteRefDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>참고 컨텐츠를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{refToDelete?.ref.title}&rdquo; 참고 컨텐츠가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteReferenceMutation.isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRefConfirm}
              disabled={deleteReferenceMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteReferenceMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
