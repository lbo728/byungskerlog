"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";

interface WriteTagInputProps {
  tags: string[];
  tagInput: string;
  showTagSuggestions: boolean;
  selectedSuggestionIndex: number;
  filteredSuggestions: string[];
  isLoading: boolean;
  onTagInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTagInput: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemoveTag: (index: number) => void;
  onAddTag: (tag: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}

export function WriteTagInput({
  tags,
  tagInput,
  showTagSuggestions,
  selectedSuggestionIndex,
  filteredSuggestions,
  isLoading,
  onTagInputChange,
  onTagInput,
  onRemoveTag,
  onAddTag,
  onFocus,
  onBlur,
}: WriteTagInputProps) {
  const tagInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="tag-input-section mt-4 p-4">
      <div className="tag-list flex flex-wrap gap-2 mb-2">
        {tags.map((tag, index) => (
          <span
            key={index}
            onClick={() => onRemoveTag(index)}
            className="tag-item px-3 py-1 bg-primary/10 text-primary rounded-full text-sm cursor-pointer hover:bg-primary/20 transition-colors"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="tag-autocomplete relative">
        <Input
          ref={tagInputRef}
          type="text"
          placeholder="태그를 입력하세요 (엔터로 등록)"
          value={tagInput}
          onChange={onTagInputChange}
          onKeyDown={onTagInput}
          onFocus={onFocus}
          onBlur={onBlur}
          className="border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-muted-foreground bg-transparent"
          disabled={isLoading}
        />
        {showTagSuggestions && filteredSuggestions.length > 0 && (
          <ul className="tag-suggestions absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
            {filteredSuggestions.slice(0, 10).map((suggestion, index) => (
              <li
                key={suggestion}
                onMouseDown={() => onAddTag(suggestion)}
                className={`tag-suggestion-item px-3 py-2 cursor-pointer text-sm transition-colors ${
                  index === selectedSuggestionIndex
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
