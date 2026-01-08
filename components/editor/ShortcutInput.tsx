"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ShortcutInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const MODIFIER_KEYS = ["ctrl", "shift", "alt", "meta"] as const;
const MODIFIER_DISPLAY: Record<string, string> = {
  ctrl: "Ctrl",
  shift: "Shift",
  alt: "Alt",
  meta: navigator.platform?.includes("Mac") ? "⌘" : "Win",
};

const BROWSER_CONFLICTS: Record<string, string> = {
  "ctrl+shift+c": "DevTools 요소 선택기",
  "ctrl+shift+i": "DevTools",
  "ctrl+shift+j": "DevTools 콘솔",
  "ctrl+shift+n": "시크릿 모드",
  "ctrl+shift+t": "탭 복원",
  "ctrl+shift+w": "창 닫기",
  "ctrl+t": "새 탭",
  "ctrl+w": "탭 닫기",
  "ctrl+n": "새 창",
  "ctrl+s": "저장",
  "ctrl+p": "인쇄",
  "ctrl+f": "찾기",
  "ctrl+h": "방문 기록",
  "ctrl+j": "다운로드",
  "meta+shift+c": "DevTools 요소 선택기",
  "meta+shift+i": "DevTools",
};

function getKeyDisplay(key: string): string {
  const specialKeys: Record<string, string> = {
    "[": "[",
    "]": "]",
    ";": ";",
    "'": "'",
    ",": ",",
    ".": ".",
    "/": "/",
    "\\": "\\",
    "`": "`",
    "-": "-",
    "=": "=",
    arrowup: "↑",
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→",
    backspace: "⌫",
    delete: "Del",
    enter: "Enter",
    escape: "Esc",
    tab: "Tab",
    space: "Space",
  };
  return specialKeys[key.toLowerCase()] || key.toUpperCase();
}

function parseShortcut(shortcut: string): string[] {
  if (!shortcut) return [];
  return shortcut.split("+").filter(Boolean);
}

function normalizeKey(e: KeyboardEvent): string | null {
  if (MODIFIER_KEYS.includes(e.key.toLowerCase() as (typeof MODIFIER_KEYS)[number])) {
    return null;
  }
  if (e.key === "Control" || e.key === "Meta" || e.key === "Alt" || e.key === "Shift") {
    return null;
  }

  if (e.code.startsWith("Key")) {
    return e.code.slice(3).toLowerCase();
  }
  if (e.code.startsWith("Digit")) {
    return e.code.slice(5);
  }
  if (e.code === "BracketLeft") return "[";
  if (e.code === "BracketRight") return "]";
  if (e.code === "Semicolon") return ";";
  if (e.code === "Quote") return "'";
  if (e.code === "Comma") return ",";
  if (e.code === "Period") return ".";
  if (e.code === "Slash") return "/";
  if (e.code === "Backslash") return "\\";
  if (e.code === "Backquote") return "`";
  if (e.code === "Minus") return "-";
  if (e.code === "Equal") return "=";
  if (e.code === "Space") return "space";
  if (e.code.startsWith("Arrow")) return e.code.toLowerCase();
  if (e.code.startsWith("F") && /^F\d+$/.test(e.code)) return e.code.toLowerCase();

  return e.key.toLowerCase();
}

export function ShortcutInput({
  value,
  onChange,
  placeholder = "키를 눌러 단축키 설정",
  className,
}: ShortcutInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  const keys = parseShortcut(value);

  const conflictKey = value.toLowerCase();
  const conflict = BROWSER_CONFLICTS[conflictKey];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const modifiers: string[] = [];
      if (e.ctrlKey) modifiers.push("ctrl");
      if (e.metaKey) modifiers.push("meta");
      if (e.altKey) modifiers.push("alt");
      if (e.shiftKey) modifiers.push("shift");

      const key = normalizeKey(e);
      if (!key) return;

      const newShortcut = [...modifiers, key].join("+");
      onChange(newShortcut);
      setIsCapturing(false);
    },
    [onChange]
  );

  useEffect(() => {
    if (isCapturing && inputRef.current) {
      const el = inputRef.current;
      el.addEventListener("keydown", handleKeyDown as EventListener);
      return () => el.removeEventListener("keydown", handleKeyDown as EventListener);
    }
  }, [isCapturing, handleKeyDown]);

  const handleFocus = () => {
    setIsFocused(true);
    setIsCapturing(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setIsCapturing(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const removeKey = (index: number) => {
    const newKeys = keys.filter((_, i) => i !== index);
    onChange(newKeys.join("+"));
  };

  return (
    <div className="shortcut-input-wrapper space-y-1">
      <div
        ref={inputRef}
        tabIndex={0}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          "shortcut-input flex items-center gap-1 min-h-[32px] px-2 py-1 rounded-md border bg-background cursor-text",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          isFocused && "ring-2 ring-ring ring-offset-2",
          isCapturing && "bg-accent/50",
          className
        )}
      >
        {keys.length === 0 ? (
          <span className="text-sm text-muted-foreground">{isCapturing ? "키 입력 대기 중..." : placeholder}</span>
        ) : (
          <>
            {keys.map((key, index) => {
              const isModifier = MODIFIER_KEYS.includes(key as (typeof MODIFIER_KEYS)[number]);
              const display = isModifier ? MODIFIER_DISPLAY[key] : getKeyDisplay(key);
              return (
                <span key={index} className="shortcut-key-group flex items-center">
                  <span
                    className={cn(
                      "shortcut-key inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono",
                      isModifier
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-muted text-foreground border border-border"
                    )}
                  >
                    {display}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeKey(index);
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                  {index < keys.length - 1 && <span className="text-muted-foreground mx-0.5">+</span>}
                </span>
              );
            })}
          </>
        )}
        {keys.length > 0 && (
          <button type="button" onClick={handleClear} className="ml-auto text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {conflict && <p className="text-xs text-destructive">⚠️ 브라우저 단축키와 충돌: {conflict}</p>}
    </div>
  );
}
