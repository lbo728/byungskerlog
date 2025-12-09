"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useUser, useStackApp } from "@stackframe/stack";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WritePage() {
  const user = useUser({ or: "redirect" }); // 로그인하지 않으면 자동 리다이렉트
  const app = useStackApp();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          published: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      const data = await response.json();
      router.push(`/posts/${data.slug}`);
      router.refresh();
    } catch (error) {
      alert("글 발행 중 오류가 발생했습니다.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await app.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">새 글 작성</h1>
          <Button variant="outline" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <Card>
            <CardHeader>
              <CardTitle>에디터</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">제목</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="글 제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">슬러그 (URL)</Label>
                  <Input
                    id="slug"
                    type="text"
                    placeholder="my-first-post"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">URL: /posts/{slug || "slug"}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">요약</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="글 요약을 입력하세요 (선택사항)"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={3}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">본문 (Markdown)</Label>
                  <Textarea
                    id="content"
                    placeholder="마크다운으로 글을 작성하세요..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={20}
                    required
                    disabled={isLoading}
                    className="font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "발행 중..." : "발행하기"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsPreview(!isPreview)}>
                    {isPreview ? "에디터" : "미리보기"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="lg:sticky lg:top-8 lg:h-fit">
            <CardHeader>
              <CardTitle>미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <h1>{title || "제목 없음"}</h1>
                {excerpt && <p className="lead text-muted-foreground">{excerpt}</p>}
                <ReactMarkdown
                  components={{
                    code(props) {
                      const { inline, className, children, ...rest } = props as {
                        inline?: boolean;
                        className?: string;
                        children?: React.ReactNode;
                      };
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <SyntaxHighlighter style={oneDark as any} language={match[1]} PreTag="div" {...rest}>
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...rest}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {content || "*여기에 미리보기가 표시됩니다*"}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
