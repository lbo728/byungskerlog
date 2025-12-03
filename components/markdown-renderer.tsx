import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const components: Components = {
    h1: ({ children, ...props }) => {
      const text = String(children);
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
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
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
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
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      return (
        <h3 id={id} className="scroll-mt-24" {...props}>
          {children}
        </h3>
      );
    },
    code: ({ inline, className, children }) => {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter style={vscDarkPlus as any} language={match[1]} PreTag="div" className="rounded-lg !my-6">
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code
          className={cn("relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold", className)}
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

    img: ({ src, alt, ...props }) => <img src={src} alt={alt || ""} className="rounded-lg shadow-md my-6" {...props} />,
    blockquote: ({ children, ...props }) => (
      <blockquote className="border-l-4 border-primary/50 pl-4 italic my-6 text-muted-foreground" {...props}>
        {children}
      </blockquote>
    ),
  };

  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
