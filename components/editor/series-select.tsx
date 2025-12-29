"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Series } from "@/lib/types/post";

interface SeriesSelectProps {
  value: string | null;
  onChange: (seriesId: string | null) => void;
  disabled?: boolean;
}

export function SeriesSelect({ value, onChange, disabled }: SeriesSelectProps) {
  const [series, setSeries] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchSeries = useCallback(async () => {
    try {
      const response = await fetch("/api/series");
      if (response.ok) {
        const data = await response.json();
        setSeries(data);
      }
    } catch (err) {
      console.error("Failed to fetch series:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const handleCreateSeries = async () => {
    if (!newSeriesName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/series", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newSeriesName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "시리즈 생성에 실패했습니다.");
      }

      const newSeries = await response.json();
      setSeries((prev) => [newSeries, ...prev]);
      onChange(newSeries.id);
      setNewSeriesName("");
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "시리즈 생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateSeries();
    }
    if (e.key === "Escape") {
      setShowCreateForm(false);
      setNewSeriesName("");
      setError(null);
    }
  };

  return (
    <div className="series-select space-y-2">
      <label className="text-sm font-medium">시리즈</label>

      <Select
        value={value || "none"}
        onValueChange={(val) => onChange(val === "none" ? null : val)}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="시리즈 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">무분류</SelectItem>
          {series.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
              {s._count && <span className="ml-2 text-muted-foreground">({s._count.posts})</span>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showCreateForm ? (
        <div className="create-series-form space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="새 시리즈 이름"
              value={newSeriesName}
              onChange={(e) => setNewSeriesName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isCreating}
              autoFocus
            />
            <Button type="button" size="sm" onClick={handleCreateSeries} disabled={isCreating || !newSeriesName.trim()}>
              {isCreating ? "생성 중..." : "추가"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCreateForm(false);
                setNewSeriesName("");
                setError(null);
              }}
              disabled={isCreating}
            >
              취소
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => setShowCreateForm(true)}
          disabled={disabled}
        >
          <Plus className="mr-2 h-4 w-4" />새 시리즈 만들기
        </Button>
      )}
    </div>
  );
}
