"use client";

import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Quote,
  Link as LinkIcon,
  Image,
  Code
} from "lucide-react";

interface MarkdownToolbarProps {
  onInsert: (text: string) => void;
}

export function MarkdownToolbar({ onInsert }: MarkdownToolbarProps) {
  const tools = [
    { icon: Heading1, label: "H1", insert: "# " },
    { icon: Heading2, label: "H2", insert: "## " },
    { icon: Heading3, label: "H3", insert: "### " },
    { icon: Heading4, label: "H4", insert: "#### " },
    { icon: Bold, label: "Bold", insert: "**텍스트**" },
    { icon: Italic, label: "Italic", insert: "*텍스트*" },
    { icon: Strikethrough, label: "Strikethrough", insert: "~~텍스트~~" },
    { icon: Quote, label: "Quote", insert: "> " },
    { icon: LinkIcon, label: "Link", insert: "[링크 텍스트](url)" },
    { icon: Image, label: "Image", insert: "![alt text](image-url)" },
    { icon: Code, label: "Code", insert: "```\ncode\n```" },
  ];

  return (
    <div className="flex items-center gap-1 p-2 border-b border-border bg-background">
      {tools.map((tool) => (
        <Button
          key={tool.label}
          variant="ghost"
          size="sm"
          onClick={() => onInsert(tool.insert)}
          title={tool.label}
          className="h-8 w-8 p-0"
        >
          <tool.icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}
