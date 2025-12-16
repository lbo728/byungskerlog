'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { calculateReadingTime } from '@/lib/reading-time';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  tags: string[];
  createdAt: Date;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PostsData {
  posts: Post[];
  pagination: Pagination;
}

interface PostsPageClientProps {
  initialData: PostsData;
  currentPage: number;
}

export function PostsPageClient({ initialData, currentPage }: PostsPageClientProps) {
  const { data } = useQuery({
    queryKey: ['posts', 'list', currentPage],
    queryFn: async () => {
      const response = await fetch(`/api/posts?page=${currentPage}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json() as Promise<PostsData>;
    },
    initialData,
    staleTime: 5 * 60 * 1000,
  });

  const { posts, pagination } = data;

  return (
    <>
      <div className="grid gap-6">
        {posts.map((post) => (
          <Link key={post.id} href={`/posts/${post.slug}`} className="group">
            <Card className="transition-colors hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <time dateTime={new Date(post.createdAt).toISOString()}>
                    {format(new Date(post.createdAt), 'MMMM d, yyyy')}
                  </time>
                  <span>·</span>
                  <span>{calculateReadingTime(post.content)}</span>
                </div>
                <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
                {post.excerpt && (
                  <CardDescription className="line-clamp-2 text-base">{post.excerpt}</CardDescription>
                )}
              </CardHeader>
              {post.tags && post.tags.length > 0 && (
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <Button
            variant="outline"
            size="sm"
            asChild
            disabled={pagination.page === 1}
            className={pagination.page === 1 ? 'pointer-events-none opacity-50' : ''}
          >
            <Link href={`/posts?page=${pagination.page - 1}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Link>
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
              <Button
                key={pageNum}
                variant={pageNum === pagination.page ? 'default' : 'outline'}
                size="sm"
                asChild
              >
                <Link href={`/posts?page=${pageNum}`}>{pageNum}</Link>
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            asChild
            disabled={pagination.page === pagination.totalPages}
            className={pagination.page === pagination.totalPages ? 'pointer-events-none opacity-50' : ''}
          >
            <Link href={`/posts?page=${pagination.page + 1}`}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}
