"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { useState, useEffect, useCallback } from "react";
import { ExternalLink, X } from "lucide-react";

const URL_REGEX = /^https?:\/\/[^\s]+$/;

interface OGData {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  url: string;
}

function EmbedCardComponent({ node, deleteNode }: NodeViewProps) {
  const url = node.attrs.url as string;
  const [ogData, setOgData] = useState<OGData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  useEffect(() => {
    setImageError(false);
    setIsLoading(true);
    setError(false);

    const fetchOgData = async () => {
      try {
        const response = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setOgData(data);
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOgData();
  }, [url]);

  const hostname = (() => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  })();

  if (error) {
    return (
      <NodeViewWrapper className="embed-card-wrapper" contentEditable={false}>
        <div className="embed-card-error relative my-4 p-3 rounded-lg border border-border bg-muted/30">
          <button
            onClick={deleteNode}
            className="embed-card-delete absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-md"
            title="삭제"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:opacity-80"
            style={{ textDecoration: "none" }}
          >
            {url}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </NodeViewWrapper>
    );
  }

  if (isLoading) {
    return (
      <NodeViewWrapper className="embed-card-wrapper" contentEditable={false}>
        <div className="embed-card-skeleton my-4 flex overflow-hidden rounded-lg border border-border bg-muted/30 animate-pulse">
          <div className="flex-1 p-4 space-y-2">
            <div className="h-5 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-1/4" />
          </div>
          <div className="w-[120px] sm:w-[200px] h-[100px] sm:h-[120px] bg-muted flex-shrink-0" />
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="embed-card-wrapper" contentEditable={false}>
      <div className="embed-card-editor relative my-4 flex overflow-hidden rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors">
        <button
          onClick={deleteNode}
          className="embed-card-delete absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-background/80 hover:bg-destructive text-muted-foreground hover:text-destructive-foreground transition-colors shadow-md border border-border z-10"
          title="삭제"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="embed-card-link flex flex-1 p-3"
          style={{ textDecoration: "none" }}
        >
          <div className="embed-card-content flex-1 min-w-0 pr-6">
            <h4 className="embed-card-title font-semibold text-foreground line-clamp-1" style={{ textDecoration: "none" }}>
              {ogData?.title || hostname}
            </h4>
            {ogData?.description && (
              <p className="embed-card-description text-sm text-muted-foreground line-clamp-2 mb-2" style={{ textDecoration: "none" }}>
                {ogData.description}
              </p>
            )}
            <div className="embed-card-meta flex items-center gap-1 text-xs text-muted-foreground" style={{ textDecoration: "none" }}>
              <ExternalLink className="h-3 w-3" />
              <span className="truncate">{ogData?.siteName || hostname}</span>
            </div>
          </div>
          {ogData?.image && !imageError && (
            <div className="embed-card-image w-[100px] sm:w-[180px] flex-shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ogData.image}
                alt={ogData.title || ""}
                className="max-w-full max-h-[120px] object-contain"
                loading="lazy"
                onError={handleImageError}
              />
            </div>
          )}
        </a>
      </div>
    </NodeViewWrapper>
  );
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    embedCard: {
      setEmbedCard: (options: { url: string }) => ReturnType;
    };
  }
}

export const EmbedCard = Node.create({
  name: "embedCard",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-embed-card]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-embed-card": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedCardComponent);
  },

  addCommands() {
    return {
      setEmbedCard:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: { write: (text: string) => void }, node: { attrs: { url: string } }) {
          state.write("\n" + node.attrs.url + "\n\n");
        },
        parse: {
          setup(markdownit: { block: { ruler: { before: (name: string, ruleName: string, rule: (state: unknown, startLine: number, endLine: number, silent: boolean) => boolean) => void } } }) {
            markdownit.block.ruler.before("paragraph", "embedCard", (state: unknown, startLine: number, endLine: number, silent: boolean) => {
              const typedState = state as {
                src: string;
                bMarks: number[];
                eMarks: number[];
                tShift: number[];
                line: number;
                push: (type: string, tag: string, nesting: number) => { content: string; map: [number, number] };
              };
              const pos = typedState.bMarks[startLine] + typedState.tShift[startLine];
              const max = typedState.eMarks[startLine];
              const line = typedState.src.slice(pos, max).trim();

              if (!URL_REGEX.test(line)) {
                return false;
              }

              if (silent) {
                return true;
              }

              const token = typedState.push("embedCard", "", 0);
              token.content = line;
              token.map = [startLine, startLine + 1];
              typedState.line = startLine + 1;

              return true;
            });
          },
          updateDOM() {},
        },
      },
    };
  },

  addProseMirrorPlugins() {
    const nodeType = this.type;

    return [
      new Plugin({
        key: new PluginKey("embedCardPaste"),
        props: {
          handlePaste(view, event) {
            const text = event.clipboardData?.getData("text/plain")?.trim();

            if (text && URL_REGEX.test(text)) {
              const { state, dispatch } = view;
              const { selection } = state;

              if (selection.empty) {
                const node = nodeType.create({ url: text });
                const transaction = state.tr.replaceSelectionWith(node);
                dispatch(transaction);
                return true;
              }
            }

            return false;
          },
        },
      }),
    ];
  },
});
