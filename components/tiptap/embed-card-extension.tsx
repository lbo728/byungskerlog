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

  addStorage() {
    return {
      markdown: {
        serialize(state: { write: (text: string) => void }, node: { attrs: { url: string } }) {
          state.write(node.attrs.url + "\n\n");
        },
        parse: {},
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
