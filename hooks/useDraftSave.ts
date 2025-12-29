"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseDraftSaveOptions {
  title: string;
  tags: string[];
  content: string;
  initialDraftId?: string | null;
}

interface UseDraftSaveReturn {
  draftId: string | null;
  setDraftId: React.Dispatch<React.SetStateAction<string | null>>;
  isSavingDraft: boolean;
  handleTempSave: () => Promise<void>;
}

export function useDraftSave({
  title,
  tags,
  content,
  initialDraftId = null,
}: UseDraftSaveOptions): UseDraftSaveReturn {
  const [draftId, setDraftId] = useState<string | null>(initialDraftId);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const handleTempSave = useCallback(async () => {
    setIsSavingDraft(true);
    try {
      if (draftId) {
        const response = await fetch(`/api/drafts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, tags, content }),
        });
        if (!response.ok) throw new Error("Failed to update draft");
        toast.success("임시저장되었습니다.");
      } else {
        const response = await fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, tags, content }),
        });
        if (!response.ok) throw new Error("Failed to create draft");
        const data = await response.json();
        setDraftId(data.id);
        window.history.replaceState(null, "", `/admin/write?draft=${data.id}`);
        toast.success("임시저장되었습니다.");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("임시저장에 실패했습니다.");
    } finally {
      setIsSavingDraft(false);
    }
  }, [draftId, title, tags, content]);

  return {
    draftId,
    setDraftId,
    isSavingDraft,
    handleTempSave,
  };
}
