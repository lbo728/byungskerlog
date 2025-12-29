"use client";

import { useState, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";

interface UseLinkModalOptions {
  editor: Editor | null;
}

interface UseLinkModalReturn {
  isLinkModalOpen: boolean;
  setIsLinkModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedText: string;
  currentLinkUrl: string;
  openLinkModal: () => void;
  handleLinkSubmit: (url: string) => void;
  handleLinkRemove: () => void;
}

export function useLinkModal({
  editor,
}: UseLinkModalOptions): UseLinkModalReturn {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [currentLinkUrl, setCurrentLinkUrl] = useState("");

  const openLinkModal = useCallback(() => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");
    setSelectedText(text);

    const linkMark = editor.getAttributes("link");
    setCurrentLinkUrl(linkMark.href || "");

    setIsLinkModalOpen(true);
  }, [editor]);

  const handleLinkSubmit = useCallback(
    (url: string) => {
      if (!editor) return;

      if (selectedText) {
        editor.chain().focus().setLink({ href: url }).run();
      } else {
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${url}">${url}</a>`)
          .run();
      }
    },
    [editor, selectedText]
  );

  const handleLinkRemove = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  }, [editor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openLinkModal();
        return;
      }

      if (e.key === "Tab" && editor?.isFocused) {
        const { state } = editor;
        const { $from } = state.selection;

        let isInList = false;
        for (let d = $from.depth; d > 0; d--) {
          const node = $from.node(d);
          if (node.type.name === "listItem") {
            isInList = true;
            break;
          }
        }

        if (isInList) {
          e.preventDefault();
          if (e.shiftKey) {
            editor.chain().focus().liftListItem("listItem").run();
          } else {
            editor.chain().focus().sinkListItem("listItem").run();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openLinkModal, editor]);

  return {
    isLinkModalOpen,
    setIsLinkModalOpen,
    selectedText,
    currentLinkUrl,
    openLinkModal,
    handleLinkSubmit,
    handleLinkRemove,
  };
}
