import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import { LinkCard } from "@/components/link-card";
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

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const urlLinePattern = /^(https?:\/\/[^\s]+)$/gm;
  const processedContent = content.replace(urlLinePattern, '\n<standalone-link href="$1"></standalone-link>\n');

  const components: Components = {
    "standalone-link": ({ href }: { href?: string }) => {
      if (href) {
        return <LinkCard url={href} />;
      }
      return null;
    },
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
        <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" className="rounded-lg !my-6">
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code
          className={cn("relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold", className)}
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
        className="border-l-4 border-primary/50 pl-4 italic my-6 text-muted-foreground before:content-[''] after:content-['']"
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
  };

  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
