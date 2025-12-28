import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDarkCustom } from "@/lib/syntax-theme";
import { cn } from "@/lib/utils";
import { LinkCard } from "@/components/common";
import type { Components } from "react-markdown";
import type { ReactElement, ReactNode } from "react";

interface MarkdownRendererProps {
  content: string;
}

interface CodeComponentProps {
  inline?: boolean;
  className?: string;
  children?: ReactNode;
}

const URL_LINE_REGEX = /^(https?:\/\/[^\s]+)$/;

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const lines = content.split("\n");
  const segments: { type: "markdown" | "url"; content: string }[] = [];

  let markdownBuffer: string[] = [];

  const flushMarkdown = () => {
    if (markdownBuffer.length > 0) {
      segments.push({ type: "markdown", content: markdownBuffer.join("\n") });
      markdownBuffer = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (URL_LINE_REGEX.test(trimmed)) {
      flushMarkdown();
      segments.push({ type: "url", content: trimmed });
    } else {
      markdownBuffer.push(line);
    }
  }
  flushMarkdown();

  const components: Components = {
    h1: ({ children, ...props }) => {
      const text = String(children);
      const id = text
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w가-힣-]/g, "");
      return (
        <h1 id={id} className="scroll-mt-24" {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ children, ...props }) => {
      const text = String(children);
      const id = text
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w가-힣-]/g, "");
      return (
        <h2 id={id} className="scroll-mt-24" {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }) => {
      const text = String(children);
      const id = text
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w가-힣-]/g, "");
      return (
        <h3 id={id} className="scroll-mt-24" {...props}>
          {children}
        </h3>
      );
    },
    code: ({ inline, className, children, ...props }: CodeComponentProps): ReactElement => {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={oneDarkCustom}
          language={match[1]}
          PreTag="div"
          className="syntax-highlighter rounded-lg !my-6"
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code
          className={cn(
            "inline-code relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm",
            "bg-[oklch(0.97_0_0)] text-[oklch(0.45_0.15_30)]",
            "dark:bg-[oklch(0.269_0_0)] dark:text-[oklch(0.85_0.15_30)]",
            className
          )}
          {...props}
        >
          {children}
        </code>
      );
    },
    a: ({ children, href, ...props }) => (
      <a
        href={href}
        className="text-primary hover:underline font-medium transition-all"
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
        {...props}
      >
        {children}
      </a>
    ),

    // eslint-disable-next-line @next/next/no-img-element
    img: ({ src, alt, ...props }) => <img src={src} alt={alt || ""} className="rounded-lg shadow-md my-6" {...props} />,
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="blockquote border-l-4 border-[oklch(0.8_0_0)] dark:border-[oklch(0.4_0_0)] pl-4 italic my-4 text-muted-foreground [&>p]:my-0"
        {...props}
      >
        {children}
      </blockquote>
    ),
    br: () => <br className="my-2" />,
    p: ({ children, ...props }) => (
      <p className="mt-3 mb-3" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul className="list-disc pl-6 my-2 [&>li]:my-0.5 [&>li>p]:my-0" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal pl-6 my-2 [&>li]:my-0.5 [&>li>p]:my-0" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="my-0.5 [&>p]:my-0" {...props}>
        {children}
      </li>
    ),
  };

  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      {segments.map((segment, index) =>
        segment.type === "url" ? (
          <LinkCard key={index} url={segment.content} />
        ) : (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={components}
          >
            {segment.content}
          </ReactMarkdown>
        )
      )}
    </div>
  );
}
