"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { LinkCard } from "@/components/link-card";

const URL_REGEX = /^https?:\/\/[^\s]+$/;

function EmbedCardComponent({ node }: NodeViewProps) {
  const url = node.attrs.url as string;

  return (
    <NodeViewWrapper className="embed-card-wrapper" contentEditable={false}>
      <LinkCard url={url} />
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
    const extensionThis = this;

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
                const node = extensionThis.type.create({ url: text });
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
