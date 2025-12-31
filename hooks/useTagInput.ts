"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

interface UseTagInputOptions {
  initialTags?: string[];
}

interface UseTagInputReturn {
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  tagInput: string;
  setTagInput: React.Dispatch<React.SetStateAction<string>>;
  allTags: string[];
  showTagSuggestions: boolean;
  setShowTagSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  selectedSuggestionIndex: number;
  filteredSuggestions: string[];
  addTag: (tag: string) => void;
  removeTag: (index: number) => void;
  handleTagInput: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleTagInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function useTagInput({
  initialTags = [],
}: UseTagInputOptions = {}): UseTagInputReturn {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  useEffect(() => {
    const fetchAllTags = async () => {
      try {
        const response = await fetch("/api/tags");
        if (response.ok) {
          const data = await response.json();
          setAllTags(data.map((item: { tag: string }) => item.tag));
        }
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      }
    };
    fetchAllTags();
  }, []);

  const filteredSuggestions = useMemo(
    () =>
      tagInput.trim()
        ? allTags.filter(
            (tag) =>
              tag.toLowerCase().includes(tagInput.toLowerCase()) &&
              !tags.includes(tag)
          )
        : [],
    [tagInput, allTags, tags]
  );

  const addTag = useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim();
      if (trimmedTag && !tags.includes(trimmedTag)) {
        setTags((prev) => [...prev, trimmedTag]);
      }
      setTagInput("");
      setShowTagSuggestions(false);
      setSelectedSuggestionIndex(0);
    },
    [tags]
  );

  const removeTag = useCallback((indexToRemove: number) => {
    setTags((prev) => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleTagInput = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.nativeEvent.isComposing) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (showTagSuggestions && filteredSuggestions.length > 0) {
          addTag(filteredSuggestions[selectedSuggestionIndex]);
        } else if (tagInput.trim()) {
          addTag(tagInput);
        }
        return;
      }

      if (e.key === "Escape") {
        setShowTagSuggestions(false);
        return;
      }
    },
    [
      filteredSuggestions,
      showTagSuggestions,
      selectedSuggestionIndex,
      tagInput,
      addTag,
    ]
  );

  const handleTagInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setTagInput(value);
      setShowTagSuggestions(value.trim().length > 0);
      setSelectedSuggestionIndex(0);
    },
    []
  );

  return {
    tags,
    setTags,
    tagInput,
    setTagInput,
    allTags,
    showTagSuggestions,
    setShowTagSuggestions,
    selectedSuggestionIndex,
    filteredSuggestions,
    addTag,
    removeTag,
    handleTagInput,
    handleTagInputChange,
  };
}
