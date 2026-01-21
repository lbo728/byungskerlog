"use client";

import { useState } from "react";
import { Sparkles, Loader2, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { cn } from "@/lib/utils";

interface KnowledgePreset {
  id: string;
  name: string;
  lastUsedAt?: Date | string | null;
}

interface AIButtonWithPresetProps {
  label: string;
  presets: KnowledgePreset[] | undefined;
  selectedPresetId: string | null;
  onPresetSelect: (presetId: string) => void;
  onAction: () => void;
  isLoading: boolean;
  disabled?: boolean;
  className?: string;
}

export function AIButtonWithPreset({
  label,
  presets,
  selectedPresetId,
  onPresetSelect,
  onAction,
  isLoading,
  disabled = false,
  className,
}: AIButtonWithPresetProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const selectedPreset = presets?.find((p) => p.id === selectedPresetId);

  const handlePresetSelect = (presetId: string) => {
    onPresetSelect(presetId);
    setMenuOpen(false);
  };

  const handleCreateClick = () => {
    window.open("/admin/posts?tab=knowledge", "_blank");
  };

  if (!presets || presets.length === 0) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleCreateClick}
        disabled={disabled}
        className={cn("h-8 px-3 text-xs gap-1.5", className)}
      >
        <Plus className="h-3.5 w-3.5" />
        사전지식 만들기
      </Button>
    );
  }

  return (
    <div className="ai-button-with-preset flex items-center gap-1.5">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isLoading || disabled}
            className={cn("h-8 px-3 text-xs gap-1.5", className)}
          >
            사전 지식 선택
            <ChevronDown className="h-3 w-3 ml-0.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">사전 지식 선택</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {presets.map((preset) => (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => handlePresetSelect(preset.id)}
              className={cn("text-sm cursor-pointer", preset.id === selectedPresetId && "bg-accent")}
            >
              {preset.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCreateClick} className="text-xs text-muted-foreground cursor-pointer">
            <Plus className="h-3.5 w-3.5 mr-2" />
            사전지식 만들기
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedPreset && (
        <Badge variant="secondary" className="text-xs px-2 py-0.5 h-6">
          {selectedPreset.name}
        </Badge>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAction}
        disabled={isLoading || disabled || !selectedPresetId}
        className={cn("h-8 px-3 text-xs gap-1.5", className)}
      >
        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {label}
      </Button>
    </div>
  );
}
