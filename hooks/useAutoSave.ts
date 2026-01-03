"use client";

import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  saveDraftToLocal,
  getDraftFromLocal,
  clearLocalDraft,
} from "@/lib/storage/draft-storage";

interface OriginalContent {
  title: string;
  content: string;
  tags: string[];
}

interface UseAutoSaveOptions {
  title: string;
  content: string;
  tags: string[];
  draftId: string | null;
  postId?: string | null;
  originalContent?: OriginalContent | null;
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
  originalContent,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const localSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<{ title: string; content: string; tags: string[] } | null>(null);
  const currentContentRef = useRef({ title, content, tags });
  const originalContentRef = useRef<OriginalContent | null>(null);
  const isEditMode = !!postId;

  useEffect(() => {
    if (originalContent && !originalContentRef.current) {
      originalContentRef.current = originalContent;
      lastSavedContentRef.current = originalContent;
    }
  }, [originalContent]);

  useEffect(() => {
    currentContentRef.current = { title, content, tags };
  }, [title, content, tags]);

  useEffect(() => {
    if (!enabled || isEditMode) return;

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
  }, [title, content, tags, draftId, isEditMode, enabled]);

  useEffect(() => {
    return () => {
      if (localSaveTimerRef.current) {
        clearTimeout(localSaveTimerRef.current);
      }
    };
  }, []);

  const getLatestDraft = useCallback(() => {
    const current = currentContentRef.current;

    if (isEditMode) {
      return current;
    }

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
  }, [isEditMode]);

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

    if (isEditMode && originalContentRef.current) {
      const original = originalContentRef.current;
      return (
        current.title !== original.title ||
        current.content !== original.content ||
        JSON.stringify(current.tags) !== JSON.stringify(original.tags)
      );
    }

    const saved = lastSavedContentRef.current;
    if (!saved) return true;

    return (
      current.title !== saved.title ||
      current.content !== saved.content ||
      JSON.stringify(current.tags) !== JSON.stringify(saved.tags)
    );
  }, [isEditMode]);

  return {
    getLatestDraft,
    saveToServerOnExit,
    clearAutoSave,
    hasUnsavedChanges,
  };
}
