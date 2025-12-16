'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculateReadingTime } from '@/lib/reading-time';

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
  const { data: posts } = useQuery({
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
        <Link href={`/posts/${post.slug}`} key={post.id} className="block group h-full">
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
            <CardFooter className="pt-0 mt-auto">
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
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}
