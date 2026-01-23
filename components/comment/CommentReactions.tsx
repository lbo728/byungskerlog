"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { CommentReactionCount, ReactionType } from "@/lib/types/comment";

const REACTION_EMOJI: Record<ReactionType, string> = {
  LIKE: "👍",
  LOVE: "❤️",
  CELEBRATE: "🎉",
  INSIGHTFUL: "💡",
};

const REACTION_LABELS: Record<ReactionType, string> = {
  LIKE: "좋아요",
  LOVE: "사랑해요",
  CELEBRATE: "축하해요",
  INSIGHTFUL: "유익해요",
};

interface CommentReactionsProps {
  reactions: CommentReactionCount[];
  onReact: (type: ReactionType) => void;
  disabled?: boolean;
  showAddButton?: boolean;
}

export function CommentReactions({
  reactions,
  onReact,
  disabled = false,
  showAddButton = true,
}: CommentReactionsProps) {
  const visibleReactions = reactions.filter((r) => r.count > 0);

  return (
    <div className="comment-reactions flex flex-wrap items-center gap-1">
      {visibleReactions.map((reaction) => (
        <Button
          key={reaction.type}
          variant="ghost"
          size="sm"
          onClick={() => onReact(reaction.type)}
          disabled={disabled}
          className={cn(
            "comment-reaction-btn h-7 px-2 text-xs gap-1",
            reaction.userReacted && "bg-primary/10 text-primary hover:bg-primary/20"
          )}
          title={REACTION_LABELS[reaction.type]}
        >
          <span>{REACTION_EMOJI[reaction.type]}</span>
          <span>{reaction.count}</span>
        </Button>
      ))}
      {showAddButton && <ReactionPicker onSelect={onReact} disabled={disabled} existingReactions={reactions} />}
    </div>
  );
}

interface ReactionPickerProps {
  onSelect: (type: ReactionType) => void;
  disabled?: boolean;
  existingReactions: CommentReactionCount[];
}

function ReactionPicker({ onSelect, disabled, existingReactions }: ReactionPickerProps) {
  const reactionTypes: ReactionType[] = ["LIKE", "LOVE", "CELEBRATE", "INSIGHTFUL"];

  return (
    <div className="reaction-picker relative group">
      <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground" disabled={disabled}>
        +
      </Button>
      <div className="reaction-picker-dropdown absolute left-0 bottom-full mb-1 hidden group-hover:flex bg-background border rounded-lg shadow-lg p-1 gap-1 z-10">
        {reactionTypes.map((type) => {
          const existing = existingReactions.find((r) => r.type === type);
          return (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              onClick={() => onSelect(type)}
              disabled={disabled}
              className={cn("h-8 w-8 p-0 text-lg hover:bg-muted", existing?.userReacted && "bg-primary/10")}
              title={REACTION_LABELS[type]}
            >
              {REACTION_EMOJI[type]}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
