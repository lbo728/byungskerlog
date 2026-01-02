"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { saveDraftToLocal, clearLocalDraft } from "@/lib/storage/draft-storage";

export type SaveStatus = "saved" | "saving" | "unsaved";

interface UseAutoSaveOptions {
  title: string;
  content: string;
  tags: string[];
  draftId: string | null;
  postId?: string | null;
  enabled?: boolean;
  onServerSave: () => Promise<void>;
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  forceSave: () => Promise<void>;
  clearAutoSave: () => void;
}

const LOCAL_SAVE_DEBOUNCE = 5000;
const SERVER_SAVE_DELAY = 60000;

export function useAutoSave({
  title,
  content,
  tags,
  draftId,
  postId,
  enabled = true,
  onServerSave,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const localSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastContentRef = useRef({ title, content, tags });
  const isServerSavingRef = useRef(false);

  const hasContentChanged = useCallback(() => {
    const last = lastContentRef.current;
    return (
      last.title !== title ||
      last.content !== content ||
      JSON.stringify(last.tags) !== JSON.stringify(tags)
    );
  }, [title, content, tags]);

  const saveToLocal = useCallback(() => {
    if (postId) return;

    saveDraftToLocal({
      title,
      content,
      tags,
      draftId: draftId || undefined,
    });
    lastContentRef.current = { title, content, tags };
    setLastSavedAt(new Date());
    setSaveStatus("saved");
  }, [title, content, tags, draftId, postId]);

  const saveToServer = useCallback(async () => {
    if (isServerSavingRef.current) return;
    if (!hasContentChanged() && draftId) return;

    isServerSavingRef.current = true;
    setSaveStatus("saving");

    try {
      await onServerSave();
      lastContentRef.current = { title, content, tags };
      setLastSavedAt(new Date());
      setSaveStatus("saved");

      if (!postId) {
        clearLocalDraft();
      }
    } catch {
      setSaveStatus("unsaved");
    } finally {
      isServerSavingRef.current = false;
    }
  }, [onServerSave, hasContentChanged, draftId, title, content, tags, postId]);

  const forceSave = useCallback(async () => {
    if (localSaveTimerRef.current) {
      clearTimeout(localSaveTimerRef.current);
      localSaveTimerRef.current = null;
    }
    if (serverSaveTimerRef.current) {
      clearTimeout(serverSaveTimerRef.current);
      serverSaveTimerRef.current = null;
    }

    await saveToServer();
  }, [saveToServer]);

  const clearAutoSave = useCallback(() => {
    clearLocalDraft();
    if (localSaveTimerRef.current) {
      clearTimeout(localSaveTimerRef.current);
      localSaveTimerRef.current = null;
    }
    if (serverSaveTimerRef.current) {
      clearTimeout(serverSaveTimerRef.current);
      serverSaveTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (postId) return;

    const hasContent = title.trim() || content.trim();
    if (!hasContent) return;

    if (hasContentChanged()) {
      setSaveStatus("unsaved");
    }

    if (localSaveTimerRef.current) {
      clearTimeout(localSaveTimerRef.current);
    }
    localSaveTimerRef.current = setTimeout(saveToLocal, LOCAL_SAVE_DEBOUNCE);

    if (serverSaveTimerRef.current) {
      clearTimeout(serverSaveTimerRef.current);
    }
    serverSaveTimerRef.current = setTimeout(saveToServer, SERVER_SAVE_DELAY);

    return () => {
      if (localSaveTimerRef.current) {
        clearTimeout(localSaveTimerRef.current);
      }
      if (serverSaveTimerRef.current) {
        clearTimeout(serverSaveTimerRef.current);
      }
    };
  }, [title, content, tags, enabled, postId, saveToLocal, saveToServer, hasContentChanged]);

  useEffect(() => {
    return () => {
      if (localSaveTimerRef.current) {
        clearTimeout(localSaveTimerRef.current);
      }
      if (serverSaveTimerRef.current) {
        clearTimeout(serverSaveTimerRef.current);
      }
    };
  }, []);

  return {
    saveStatus,
    lastSavedAt,
    forceSave,
    clearAutoSave,
  };
}
