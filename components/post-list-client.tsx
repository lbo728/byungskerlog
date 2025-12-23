'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calculateReadingTime } from '@/lib/reading-time';
import { useUser } from '@stackframe/stack';
import { useRouter } from 'next/navigation';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PostListClientProps {
  initialData: Post[];
}

export function PostListClient({ initialData }: PostListClientProps) {
  const user = useUser();
  const router = useRouter();

  const { data: posts, isPending } = useQuery({
    queryKey: ['posts', 'home'],
    queryFn: async () => {
      const response = await fetch('/api/posts');
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      return data.posts;
    },
    initialData,
    staleTime: 5 * 60 * 1000,
  });

  const handleDelete = async (postId: string, postTitle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`"${postTitle}" 포스트를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      toast.success('포스트가 삭제되었습니다.');
      router.refresh();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('포스트 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/admin/write?id=${postId}`);
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-muted-foreground">아직 작성된 포스트가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post: Post) => (
        <div key={post.id} className="relative h-full">
          <Link href={`/posts/${post.slug}`} className="block group h-full">
            <Card className="h-full flex flex-col overflow-hidden border-border/40 bg-card/50 hover:bg-card hover:shadow-md transition-all duration-300 group-hover:border-primary/50">
              <CardHeader>
                <div className="flex justify-between items-center mb-3">
                  <Badge variant="outline" className="font-normal">
                    Post
                  </Badge>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <time dateTime={new Date(post.createdAt).toISOString()}>
                      {format(new Date(post.createdAt), 'yyyy.MM.dd')}
                    </time>
                    <span>·</span>
                    <span>{calculateReadingTime(post.content)}</span>
                  </div>
                </div>
                <CardTitle className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="grow">
                <CardDescription className="line-clamp-3 text-base">{post.excerpt || ''}</CardDescription>
              </CardContent>
              <CardFooter className="pt-0 mt-auto flex justify-between items-center">
                <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Read more
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-arrow-right"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
                {user && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleEdit(post.id, e)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => handleDelete(post.id, post.title, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          </Link>
        </div>
      ))}
    </div>
  );
}
