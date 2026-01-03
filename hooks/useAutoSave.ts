"use client";

import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  saveDraftToLocal,
  getDraftFromLocal,
  clearLocalDraft,
} from "@/lib/storage/draft-storage";

interface UseAutoSaveOptions {
  title: string;
  content: string;
  tags: string[];
  draftId: string | null;
  postId?: string | null;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  getLatestDraft: () => { title: string; content: string; tags: string[] };
  saveToServerOnExit: (onServerSave: () => Promise<void>) => Promise<void>;
  clearAutoSave: () => void;
  hasUnsavedChanges: () => boolean;
}

const LOCAL_SAVE_DEBOUNCE = 10000;

export function useAutoSave({
  title,
  content,
  tags,
  draftId,
  postId,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const localSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<{ title: string; content: string; tags: string[] } | null>(null);
  const currentContentRef = useRef({ title, content, tags });

  useEffect(() => {
    currentContentRef.current = { title, content, tags };
  }, [title, content, tags]);

  useEffect(() => {
    if (!enabled || postId) return;

    const hasContent = title.trim() || content.trim();
    if (!hasContent) return;

    if (localSaveTimerRef.current) {
      clearTimeout(localSaveTimerRef.current);
    }

    localSaveTimerRef.current = setTimeout(() => {
      saveDraftToLocal({
        title,
        content,
        tags,
        draftId: draftId || undefined,
      });
      lastSavedContentRef.current = { title, content, tags };
      toast.success("임시 저장되었습니다.");
    }, LOCAL_SAVE_DEBOUNCE);

    return () => {
      if (localSaveTimerRef.current) {
        clearTimeout(localSaveTimerRef.current);
      }
    };
  }, [title, content, tags, draftId, postId, enabled]);

  useEffect(() => {
    return () => {
      if (localSaveTimerRef.current) {
        clearTimeout(localSaveTimerRef.current);
      }
    };
  }, []);

  const getLatestDraft = useCallback(() => {
    const current = currentContentRef.current;
    const saved = getDraftFromLocal();

    if (!saved) return current;

    const currentHasContent = current.title.trim() || current.content.trim();
    const savedHasContent = saved.title.trim() || saved.content.trim();

    if (!currentHasContent && savedHasContent) {
      return { title: saved.title, content: saved.content, tags: saved.tags };
    }

    const isCurrentDifferentFromSaved =
      current.title !== saved.title ||
      current.content !== saved.content ||
      JSON.stringify(current.tags) !== JSON.stringify(saved.tags);

    if (isCurrentDifferentFromSaved) {
      return current;
    }

    return { title: saved.title, content: saved.content, tags: saved.tags };
  }, []);

  const saveToServerOnExit = useCallback(async (onServerSave: () => Promise<void>) => {
    try {
      await onServerSave();
      clearLocalDraft();
    } catch (error) {
      console.error("Failed to save on exit:", error);
    }
  }, []);

  const clearAutoSave = useCallback(() => {
    clearLocalDraft();
    lastSavedContentRef.current = null;
    if (localSaveTimerRef.current) {
      clearTimeout(localSaveTimerRef.current);
      localSaveTimerRef.current = null;
    }
  }, []);

  const hasUnsavedChanges = useCallback(() => {
    const current = currentContentRef.current;
    const hasContent = current.title.trim() || current.content.trim();
    if (!hasContent) return false;

    const saved = lastSavedContentRef.current;
    if (!saved) return true;

    return (
      current.title !== saved.title ||
      current.content !== saved.content ||
      JSON.stringify(current.tags) !== JSON.stringify(saved.tags)
    );
  }, []);

  return {
    getLatestDraft,
    saveToServerOnExit,
    clearAutoSave,
    hasUnsavedChanges,
  };
}
