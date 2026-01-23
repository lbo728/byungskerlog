"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  getOrCreateIdentity,
  getRandomIdentity,
  getAllAvatars,
  saveIdentity,
  type AnonymousIdentity,
} from "@/lib/comment-identity";
import { Shuffle } from "lucide-react";

interface CommentFormProps {
  onSubmit: (content: string, identity: AnonymousIdentity) => Promise<void>;
  placeholder?: string;
  submitLabel?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
  isSubmitting?: boolean;
  compact?: boolean;
  forceNewIdentity?: boolean;
}

export function CommentForm({
  onSubmit,
  placeholder = "입력한 댓글은 수정하거나 삭제할 수 없어요. 또한 허위사실, 욕설, 사칭 등 댓글은 통보없이 삭제될 수 있습니다.",
  submitLabel = "댓글 남기기",
  onCancel,
  autoFocus = false,
  isSubmitting = false,
  compact = false,
  forceNewIdentity = false,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [identity, setIdentity] = useState<AnonymousIdentity>({ nickname: "", avatar: "" });
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);

  useEffect(() => {
    if (forceNewIdentity) {
      setIdentity(getRandomIdentity());
    } else {
      setIdentity(getOrCreateIdentity());
    }
  }, [forceNewIdentity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting || !identity.nickname) return;

    await onSubmit(content.trim(), identity);
    setContent("");
  };

  const handleRandomize = () => {
    const newIdentity = getRandomIdentity();
    setIdentity(newIdentity);
    saveIdentity(newIdentity);
  };

  const handleAvatarSelect = (avatar: string) => {
    const newIdentity = { ...identity, avatar };
    setIdentity(newIdentity);
    saveIdentity(newIdentity);
    setShowAvatarPicker(false);
  };

  const handleNicknameChange = (nickname: string) => {
    const newIdentity = { ...identity, nickname };
    setIdentity(newIdentity);
    saveIdentity(newIdentity);
  };

  const avatars = getAllAvatars();

  return (
    <form onSubmit={handleSubmit} className="comment-form space-y-4">
      <div className="comment-identity-row flex items-center gap-3">
        <div className="avatar-selector relative">
          <button
            type="button"
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className={cn(
              "avatar-button h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center",
              "text-2xl hover:bg-primary/10 transition-colors border-2 border-transparent",
              "hover:border-primary/30 focus:outline-none focus:border-primary"
            )}
            title="아바타 변경"
          >
            {identity.avatar || "🐧"}
          </button>
          {showAvatarPicker && (
            <div className="avatar-picker absolute left-0 top-full mt-2 p-3 bg-background border rounded-xl shadow-lg z-20 w-[280px]">
              <div className="grid grid-cols-6 gap-2">
                {avatars.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => handleAvatarSelect(avatar)}
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center text-xl",
                      "hover:bg-primary/10 transition-colors",
                      identity.avatar === avatar && "bg-primary/20 ring-2 ring-primary"
                    )}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="nickname-input flex-1 flex items-center gap-2">
          {isEditingNickname ? (
            <input
              type="text"
              value={identity.nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              onBlur={() => setIsEditingNickname(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingNickname(false)}
              autoFocus
              className={cn(
                "flex-1 px-3 py-2 rounded-lg border bg-background",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              )}
              placeholder="닉네임을 입력하세요"
              maxLength={20}
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingNickname(true)}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg border bg-muted/30 text-left",
                "hover:bg-muted/50 transition-colors"
              )}
            >
              <span className="font-medium">{identity.nickname || "닉네임을 입력하세요"}</span>
            </button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRandomize}
            className="shrink-0"
            title="랜덤 변경"
          >
            <Shuffle className="h-4 w-4 mr-1" />
            랜덤 변경
          </Button>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            if (content.trim() && identity.nickname && !isSubmitting) {
              handleSubmit(e);
            }
          }
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "comment-textarea w-full rounded-lg border bg-background p-4",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
          "resize-none transition-colors text-sm",
          compact ? "min-h-[80px]" : "min-h-[120px]"
        )}
        disabled={isSubmitting}
      />

      <div className="comment-form-actions flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={!content.trim() || !identity.nickname || isSubmitting} className="px-6">
          {isSubmitting ? "저장 중..." : submitLabel}
          {!isSubmitting && <span className="ml-2 text-xs opacity-60 hidden sm:inline">⌘↵</span>}
        </Button>
      </div>
    </form>
  );
}
