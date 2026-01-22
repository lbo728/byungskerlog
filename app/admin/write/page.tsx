"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUser } from "@stackframe/stack";
import { Input } from "@/components/ui/Input";
import { PublishModal } from "@/components/modals/PublishModal";

import { RecoveryModal } from "@/components/modals/RecoveryModal";
import { ExitConfirmModal } from "@/components/modals/ExitConfirmModal";
import { ClearConfirmModal } from "@/components/modals/ClearConfirmModal";
import { EmbedCard } from "@/components/editor/tiptap/EmbedCardExtension";
import { LinkModal } from "@/components/editor/tiptap/LinkModal";
import { WriteTocDesktop, WriteFloatingMenu } from "@/components/editor/WriteToc";
import { WriteHeader } from "@/components/editor/WriteHeader";
import { WriteTagInput } from "@/components/editor/WriteTagInput";
import { WriteEditorArea } from "@/components/editor/WriteEditorArea";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { common, createLowlight } from "lowlight";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useTagInput } from "@/hooks/useTagInput";
import { useDraftSave } from "@/hooks/useDraftSave";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useExitConfirm } from "@/hooks/useExitConfirm";
import { useLinkModal } from "@/hooks/useLinkModal";
import { generateExcerpt } from "@/lib/excerpt";
import { generateSlug } from "@/lib/utils/slug";
import { usePost } from "@/hooks/usePost";
import { useDraft } from "@/hooks/useDrafts";
import { getDraftFromLocal, clearLocalDraft, hasUnsavedLocalDraft, type LocalDraft } from "@/lib/storage/draft-storage";
import { queryKeys } from "@/lib/queryKeys";
import { useSnippets } from "@/hooks/useSnippets";

const lowlight = createLowlight(common);

export default function WritePage() {
  useUser({ or: "redirect" });
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const postId = searchParams.get("id");
  const draftIdParam = searchParams.get("draft");
  const isEditMode = !!postId;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [modalPostType, setModalPostType] = useState<"LONG" | "SHORT">("LONG");
  const [modalThumbnailUrl, setModalThumbnailUrl] = useState<string | null>(null);
  const [modalThumbnailFile, setModalThumbnailFile] = useState<File | null>(null);
  const [modalSeriesId, setModalSeriesId] = useState<string | null>(null);
  const [modalExcerpt, setModalExcerpt] = useState<string>("");
  const [modalSlug, setModalSlug] = useState<string>("");
  const [modalSubSlug, setModalSubSlug] = useState<string>("");
  const [modalLinkedinContent, setModalLinkedinContent] = useState<string | null>(null);
  const [modalThreadsContent, setModalThreadsContent] = useState<string[]>([]);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [isExcerptInitialized, setIsExcerptInitialized] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [recoveryDraft, setRecoveryDraft] = useState<LocalDraft | null>(null);
  const [originalContent, setOriginalContent] = useState<{
    title: string;
    content: string;
    tags: string[];
  } | null>(null);
  const [initialDraftContent, setInitialDraftContent] = useState<{
    title: string;
    content: string;
    tags: string[];
  } | null>(null);

  const { data: postData, isLoading: isLoadingPost } = usePost(postId || "", {
    enabled: isEditMode && !!postId,
  });

  const { data: draftData, isLoading: isLoadingDraft } = useDraft(draftIdParam || "", {
    enabled: !isEditMode && !!draftIdParam,
  });

  const isFetchingPost = isLoadingPost || isLoadingDraft;

  const {
    tags,
    setTags,
    tagInput,
    showTagSuggestions,
    setShowTagSuggestions,
    selectedSuggestionIndex,
    filteredSuggestions,
    addTag,
    removeTag,
    handleTagInput,
    handleTagInputChange,
  } = useTagInput();

  const { data: snippets = [] } = useSnippets();

  const { draftId, setDraftId, isSavingDraft, handleTempSave } = useDraftSave({
    title,
    tags,
    content,
    initialDraftId: draftIdParam,
  });

  const { getLatestDraft, saveToServerOnExit, clearAutoSave, hasUnsavedChanges } = useAutoSave({
    title,
    content,
    tags,
    draftId,
    postId,
    originalContent,
    initialDraftContent,
    enabled: isFormInitialized,
  });

  const handleExitWithSave = useCallback(async () => {
    if (isEditMode) {
      return;
    }

    const latestDraft = getLatestDraft();
    const hasContent = latestDraft.title.trim() || latestDraft.content.trim();

    if (!hasContent) return;

    await saveToServerOnExit(async () => {
      if (draftId) {
        const response = await fetch(`/api/drafts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(latestDraft),
        });
        if (!response.ok) throw new Error("Failed to update draft");
        queryClient.invalidateQueries({ queryKey: queryKeys.drafts.detail(draftId) });
      } else {
        const response = await fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(latestDraft),
        });
        if (!response.ok) throw new Error("Failed to create draft");
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts.lists() });
    });
  }, [isEditMode, getLatestDraft, saveToServerOnExit, draftId, queryClient]);

  const {
    isModalOpen: isExitModalOpen,
    setIsModalOpen: setIsExitModalOpen,
    handleConfirmExit,
    handleCancelExit,
    triggerExit,
  } = useExitConfirm({
    enabled: isFormInitialized && hasUnsavedChanges(),
    onBeforeExit: handleExitWithSave,
  });

  const handleExit = useCallback(() => {
    const exitPath = draftIdParam ? "/admin/drafts" : "/admin/posts";
    triggerExit(exitPath);
  }, [triggerExit, draftIdParam]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "javascript",
      }),
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2 hover:text-primary/80 transition-colors cursor-pointer",
        },
      }),
      TiptapImage.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-lg shadow-md my-6 max-w-full h-auto",
        },
      }),
      EmbedCard,
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
        linkify: true,
      }),
      Placeholder.configure({
        placeholder: "내용을 입력하세요...",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      interface EditorStorageWithMarkdown extends Record<string, unknown> {
        markdown?: {
          getMarkdown: () => string;
        };
      }
      const storage = editor.storage as unknown as EditorStorageWithMarkdown;
      const markdown = storage.markdown?.getMarkdown() || editor.getText();
      setContent(markdown);
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg dark:prose-invert max-w-none focus:outline-none p-8 pb-16 min-h-full",
      },
    },
  });

  const { isDragging, isUploading, handleDragOver, handleDragLeave, handleDrop, handleFileSelect } = useImageUpload({
    editor,
    imageInputRef,
  });

  const { isLinkModalOpen, setIsLinkModalOpen, selectedText, currentLinkUrl, handleLinkSubmit, handleLinkRemove } =
    useLinkModal({ editor });

  useEffect(() => {
    if (editor && content) {
      interface EditorStorageWithMarkdown extends Record<string, unknown> {
        markdown?: {
          getMarkdown: () => string;
        };
      }
      const storage = editor.storage as unknown as EditorStorageWithMarkdown;
      const currentMarkdown = storage.markdown?.getMarkdown() || editor.getText();
      if (content !== currentMarkdown) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  useEffect(() => {
    if (isEditMode && postData && !isFormInitialized) {
      queueMicrotask(() => {
        setTitle(postData.title);
        setTags(postData.tags || []);
        setContent(postData.content);
        setOriginalContent({
          title: postData.title,
          content: postData.content,
          tags: postData.tags || [],
        });
        setModalPostType(postData.type || "LONG");
        setModalThumbnailUrl(postData.thumbnail || null);
        setModalThumbnailFile(null);
        setModalSeriesId(postData.series?.id || null);
        setModalExcerpt(postData.excerpt || "");
        setModalSlug(postData.slug || "");
        setModalSubSlug(postData.subSlug || "");
        setModalLinkedinContent(postData.linkedinContent || null);
        setModalThreadsContent(postData.threadsContent || []);
        setIsExcerptInitialized(true);
        setIsFormInitialized(true);
      });
    }
  }, [isEditMode, postData, isFormInitialized, setTags]);

  useEffect(() => {
    if (!isEditMode && draftData && !isFormInitialized) {
      queueMicrotask(() => {
        setTitle(draftData.title || "");
        setTags(draftData.tags || []);
        setContent(draftData.content || "");
        setDraftId(draftData.id);
        setInitialDraftContent({
          title: draftData.title || "",
          content: draftData.content || "",
          tags: draftData.tags || [],
        });
        setIsFormInitialized(true);
      });
    }
  }, [isEditMode, draftData, isFormInitialized, setTags, setDraftId]);

  useEffect(() => {
    if (!postId && !draftIdParam) {
      queueMicrotask(() => {
        setIsFormInitialized(true);
      });
    }
  }, [postId, draftIdParam]);

  useEffect(() => {
    if (isLoadingPost === false && isEditMode && !postData) {
      toast.error("글을 불러오는데 실패했습니다.");
      router.push("/admin/posts");
    }
  }, [isLoadingPost, isEditMode, postData, router]);

  useEffect(() => {
    if (isLoadingDraft === false && !isEditMode && draftIdParam && !draftData) {
      toast.error("임시저장을 불러오는데 실패했습니다.");
      router.push("/admin/drafts");
    }
  }, [isLoadingDraft, isEditMode, draftIdParam, draftData, router]);

  useEffect(() => {
    if (!isEditMode && !draftIdParam && isFormInitialized) {
      if (hasUnsavedLocalDraft(null)) {
        const localDraft = getDraftFromLocal();
        if (localDraft) {
          queueMicrotask(() => {
            setRecoveryDraft(localDraft);
            setIsRecoveryModalOpen(true);
          });
        }
      }
    }
  }, [isEditMode, draftIdParam, isFormInitialized]);

  useEffect(() => {
    // Map special characters to their e.code values
    const specialKeyCodeMap: Record<string, string> = {
      "[": "BracketLeft",
      "]": "BracketRight",
      "{": "BracketLeft",
      "}": "BracketRight",
      ";": "Semicolon",
      "'": "Quote",
      ",": "Comma",
      ".": "Period",
      "/": "Slash",
      "\\": "Backslash",
      "`": "Backquote",
      "-": "Minus",
      "=": "Equal",
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editor || snippets.length === 0) return;

      for (const snippet of snippets) {
        if (!snippet.shortcut) continue;

        const parts = snippet.shortcut.toLowerCase().split("+");
        const needsCtrl = parts.includes("ctrl");
        const needsMeta = parts.includes("meta") || parts.includes("cmd");
        const needsShift = parts.includes("shift");
        const needsAlt = parts.includes("alt");
        const modifierKeys = ["ctrl", "shift", "alt", "meta", "cmd"];
        const key = parts.filter((p) => !modifierKeys.includes(p))[0];

        if (!key) continue;

        const expectedCode = specialKeyCodeMap[key];
        const keyMatches =
          e.key.toLowerCase() === key ||
          e.code.toLowerCase() === `key${key}` ||
          e.code.toLowerCase() === `digit${key}` ||
          (expectedCode && e.code === expectedCode);

        const ctrlMatches = needsCtrl ? e.ctrlKey : !e.ctrlKey;
        const metaMatches = needsMeta ? e.metaKey : !e.metaKey;
        const shiftMatches = needsShift ? e.shiftKey : !e.shiftKey;
        const altMatches = needsAlt ? e.altKey : !e.altKey;

        if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
          e.preventDefault();
          editor.commands.insertContent(snippet.content);
          return;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editor, snippets]);

  const handleRecoverDraft = useCallback(() => {
    if (recoveryDraft) {
      setTitle(recoveryDraft.title);
      setTags(recoveryDraft.tags);
      setContent(recoveryDraft.content);
      if (recoveryDraft.draftId) {
        setDraftId(recoveryDraft.draftId);
        window.history.replaceState(null, "", `/admin/write?draft=${recoveryDraft.draftId}`);
      }
      toast.success("이전 글이 복구되었습니다.");
    }
  }, [recoveryDraft, setTags, setDraftId]);

  const handleDiscardDraft = useCallback(() => {
    clearLocalDraft();
    setRecoveryDraft(null);
  }, []);

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      if (isEditMode && !isSlugManuallyEdited) {
        setModalSlug(generateSlug(newTitle));
      }
    },
    [isEditMode, isSlugManuallyEdited]
  );

  const handleSlugChange = useCallback((newSlug: string) => {
    setModalSlug(newSlug);
    setIsSlugManuallyEdited(true);
  }, []);

  const handleClearContent = useCallback(() => {
    setTitle("");
    setContent("");
    setTags([]);
    editor?.commands.clearContent();
    setIsClearModalOpen(false);
    toast.success("내용이 모두 삭제되었습니다.");
  }, [editor, setTags]);

  const handleOpenPublishModal = () => {
    if (!title.trim()) {
      toast.warning("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      toast.warning("내용을 입력해주세요.");
      return;
    }

    if (!isExcerptInitialized) {
      setModalExcerpt(generateExcerpt(content, 150));
      setIsExcerptInitialized(true);
    }
    setIsPublishModalOpen(true);
  };

  const handleThumbnailFileChange = useCallback(
    (file: File | null) => {
      if (modalThumbnailUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(modalThumbnailUrl);
      }

      if (file) {
        const blobUrl = URL.createObjectURL(file);
        setModalThumbnailUrl(blobUrl);
        setModalThumbnailFile(file);
      } else {
        setModalThumbnailUrl(null);
        setModalThumbnailFile(null);
      }
    },
    [modalThumbnailUrl]
  );

  const handleThumbnailRemove = useCallback(() => {
    if (modalThumbnailUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(modalThumbnailUrl);
    }
    setModalThumbnailUrl(null);
    setModalThumbnailFile(null);
  }, [modalThumbnailUrl]);

  const handlePublishSuccess = (slug: string) => {
    clearAutoSave();
    queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
    const path = modalPostType === "SHORT" ? `/short/${slug}` : `/posts/${slug}`;
    router.push(path);
    router.refresh();
    toast.success(isEditMode ? "포스트가 수정되었습니다." : "포스트가 업로드 되었습니다.");
  };

  return (
    <div className="write-page min-h-screen bg-background overflow-x-hidden">
      <WriteHeader
        isEditMode={isEditMode}
        isLoading={isLoading}
        isSavingDraft={isSavingDraft}
        isFetchingPost={isFetchingPost}
        onExit={handleExit}
        onTempSave={handleTempSave}
        onPublish={handleOpenPublishModal}
      />

      <div className="container mx-auto max-w-full overflow-x-hidden pt-28">
        {isFetchingPost ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-7rem)]">
            <p className="text-muted-foreground">글을 불러오는 중...</p>
          </div>
        ) : (
          <div className="write-editor-container relative flex justify-center min-h-[calc(100vh-7rem)]">
            <aside className="write-toc-sidebar hidden xl:block fixed right-8 top-32 w-64 z-30">
              <WriteTocDesktop content={content} editorSelector=".tiptap-editor" />
            </aside>

            <div className="write-editor-panel w-full max-w-4xl flex flex-col pt-4 overflow-x-hidden xl:mr-72">
              <div className="px-2 sm:px-0">
                <Input
                  type="text"
                  placeholder="제목을 입력하세요"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="title-input text-base font-bold border-none p-4 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 bg-transparent"
                  disabled={isLoading}
                />
                <WriteTagInput
                  tags={tags}
                  tagInput={tagInput}
                  showTagSuggestions={showTagSuggestions}
                  selectedSuggestionIndex={selectedSuggestionIndex}
                  filteredSuggestions={filteredSuggestions}
                  isLoading={isLoading}
                  onTagInputChange={handleTagInputChange}
                  onTagInput={handleTagInput}
                  onRemoveTag={removeTag}
                  onAddTag={addTag}
                  onFocus={() => tagInput.trim() && setShowTagSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTagSuggestions(false), 150)}
                />
              </div>

              <WriteEditorArea
                editor={editor}
                isDragging={isDragging}
                isUploading={isUploading}
                imageInputRef={imageInputRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onFileSelect={handleFileSelect}
                onClearContent={() => setIsClearModalOpen(true)}
                hasContent={!!content.trim()}
              />
            </div>
          </div>
        )}
      </div>

      <PublishModal
        open={isPublishModalOpen}
        onOpenChange={setIsPublishModalOpen}
        title={title}
        content={content}
        tags={tags}
        isEditMode={isEditMode}
        postId={postId || undefined}
        draftId={draftId}
        onPublishSuccess={handlePublishSuccess}
        postType={modalPostType}
        onPostTypeChange={setModalPostType}
        thumbnailUrl={modalThumbnailUrl}
        thumbnailFile={modalThumbnailFile}
        onThumbnailFileChange={handleThumbnailFileChange}
        onThumbnailRemove={handleThumbnailRemove}
        seriesId={modalSeriesId}
        onSeriesIdChange={setModalSeriesId}
        excerpt={modalExcerpt}
        onExcerptChange={setModalExcerpt}
        slug={modalSlug}
        onSlugChange={handleSlugChange}
        subSlug={modalSubSlug}
        onSubSlugChange={setModalSubSlug}
        initialLinkedinContent={modalLinkedinContent}
        initialThreadsContent={modalThreadsContent}
      />

      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSubmit={handleLinkSubmit}
        onRemove={currentLinkUrl ? handleLinkRemove : undefined}
        initialUrl={currentLinkUrl}
        selectedText={selectedText}
      />

      {recoveryDraft && (
        <RecoveryModal
          open={isRecoveryModalOpen}
          onOpenChange={setIsRecoveryModalOpen}
          localDraft={recoveryDraft}
          onRecover={handleRecoverDraft}
          onDiscard={handleDiscardDraft}
        />
      )}

      <ExitConfirmModal
        open={isExitModalOpen}
        onOpenChange={setIsExitModalOpen}
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
        isEditMode={isEditMode}
      />

      <ClearConfirmModal open={isClearModalOpen} onOpenChange={setIsClearModalOpen} onConfirm={handleClearContent} />

      <WriteFloatingMenu
        content={content}
        editorSelector=".tiptap-editor"
        onImageUpload={() => imageInputRef.current?.click()}
        onSnippetInsert={(snippetContent) => {
          editor?.commands.insertContent(snippetContent);
        }}
      />
    </div>
  );
}
