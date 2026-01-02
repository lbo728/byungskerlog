"use client";

import { useState, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDarkCustom } from "@/lib/syntax-theme";
import { cn } from "@/lib/utils";
import { LinkCard } from "@/components/common/link-card";
import { Copy, Check } from "lucide-react";
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

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className="code-block-wrapper relative my-6 group">
      <button
        onClick={handleCopy}
        className="copy-button absolute top-2 right-2 z-10 p-2 rounded-md bg-[oklch(0.15_0_0)] dark:bg-[oklch(0.3_0_0)] hover:bg-[oklch(0.2_0_0)] dark:hover:bg-[oklch(0.4_0_0)] transition-colors"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
        ) : (
          <Copy className="w-3 h-3 md:w-4 md:h-4" />
        )}
      </button>
      <SyntaxHighlighter
        style={oneDarkCustom}
        language={language}
        PreTag="div"
        className="syntax-highlighter rounded-lg"
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // 전체 content에서 헤딩 ID를 미리 계산 (중복 처리 포함)
  const headingIds = useMemo(() => {
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const ids: string[] = [];
    const idCounts: Record<string, number> = {};
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const text = match[2].trim();
      const baseId = text
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w가-힣-]/g, "");

      const count = idCounts[baseId] || 0;
      const id = count === 0 ? baseId : `${baseId}-${count}`;
      idCounts[baseId] = count + 1;
      ids.push(id);
    }

    return ids;
  }, [content]);

  // 렌더링 시 헤딩 인덱스 추적용 ref
  const headingIndexRef = useRef(0);
  // 렌더링 시작할 때 인덱스 초기화
  headingIndexRef.current = 0;

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
      const id = headingIds[headingIndexRef.current] || "";
      headingIndexRef.current++;
      return (
        <h1 id={id} className="scroll-mt-24" {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ children, ...props }) => {
      const id = headingIds[headingIndexRef.current] || "";
      headingIndexRef.current++;
      return (
        <h2 id={id} className="scroll-mt-24" {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }) => {
      const id = headingIds[headingIndexRef.current] || "";
      headingIndexRef.current++;
      return (
        <h3 id={id} className="scroll-mt-24" {...props}>
          {children}
        </h3>
      );
    },
    code: ({ inline, className, children, ...props }: CodeComponentProps): ReactElement => {
      const match = /language-(\w+)/.exec(className || "");
      if (!inline && match) {
        const codeContent = String(children).replace(/\n$/, "");
        return <CodeBlock code={codeContent} language={match[1]} />;
      }
      return (
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
        className="blockquote border-l-4 border-[oklch(0.8_0_0)] dark:border-[oklch(0.4_0_0)] pl-4 italic my-4 text-muted-foreground text-base md:text-lg leading-7 md:leading-9 [&>p]:my-0"
        {...props}
      >
        {children}
      </blockquote>
    ),
    br: () => <br className="my-2" />,
    pre: ({ children, ...props }) => (
      <pre className="p-0" {...props}>
        {children}
      </pre>
    ),
    p: ({ children, ...props }) => (
      <p className="text-base md:text-lg leading-7 md:leading-9 mt-3 mb-3" {...props}>
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
      <li className="text-base md:text-lg leading-7 md:leading-9 my-0.5 [&>p]:my-0" {...props}>
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
          <ReactMarkdown key={index} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
            {segment.content}
          </ReactMarkdown>
        )
      )}
    </div>
  );
}
