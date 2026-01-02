const STORAGE_KEY = "byungskerlog_draft";

export interface LocalDraft {
  title: string;
  content: string;
  tags: string[];
  savedAt: number;
  postId?: string;
  draftId?: string;
}

export function saveDraftToLocal(draft: Omit<LocalDraft, "savedAt">): void {
  try {
    const data: LocalDraft = {
      ...draft,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded, clearing old drafts");
      localStorage.removeItem(STORAGE_KEY);
    }
    console.error("Failed to save draft to localStorage:", error);
  }
}

export function getDraftFromLocal(): LocalDraft | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as LocalDraft;
  } catch (error) {
    console.error("Failed to get draft from localStorage:", error);
    return null;
  }
}

export function clearLocalDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear draft from localStorage:", error);
  }
}

export function hasNewerLocalDraft(serverUpdatedAt?: number): boolean {
  const localDraft = getDraftFromLocal();
  if (!localDraft) return false;
  if (!serverUpdatedAt) return true;
  return localDraft.savedAt > serverUpdatedAt;
}

export function hasUnsavedLocalDraft(currentDraftId?: string | null): boolean {
  const localDraft = getDraftFromLocal();
  if (!localDraft) return false;
  if (currentDraftId && localDraft.draftId === currentDraftId) return false;
  const hasContent = localDraft.title.trim() || localDraft.content.trim();
  return Boolean(hasContent);
}
