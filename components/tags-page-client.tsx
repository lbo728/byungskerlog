'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TagData {
  tag: string;
  count: number;
}

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  tags: string[];
  createdAt: string;
}

interface TagsPageClientProps {
  initialTags: TagData[];
}

export function TagsPageClient({ initialTags }: TagsPageClientProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Query for all tags
  const { data: allTags, isPending } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      return response.json() as Promise<TagData[]>;
    },
    initialData: initialTags,
    staleTime: 5 * 60 * 1000,
  });

  // Query for posts by tag (only when tag is selected)
  const { data: filteredPosts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['posts', 'by-tag', selectedTag],
    queryFn: async () => {
      if (!selectedTag) return [];
      const response = await fetch(`/api/posts?tag=${encodeURIComponent(selectedTag)}&limit=100`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      return data.posts || [];
    },
    enabled: !!selectedTag, // Only run when selectedTag is not null
    staleTime: 5 * 60 * 1000,
  });

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* All Tags */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">All Tags ({allTags?.length || 0})</h2>
        <div className="flex flex-wrap gap-3">
          {allTags?.map(({ tag, count }) => (
            <Badge
              key={tag}
              variant={selectedTag === tag ? 'default' : 'outline'}
              className="cursor-pointer text-base px-4 py-2 hover:bg-primary/90 transition-colors"
              onClick={() => handleTagClick(tag)}
            >
              {tag} ({count})
            </Badge>
          ))}
        </div>
      </div>

      {/* Filtered Posts */}
      {selectedTag && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Posts tagged with "{selectedTag}" ({filteredPosts?.length || 0})
          </h2>
          {isLoadingPosts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredPosts?.map((post: Post) => (
                <Link key={post.id} href={`/posts/${post.slug}`} className="group">
                  <Card className="transition-colors hover:border-primary">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <time className="text-sm text-muted-foreground" dateTime={post.createdAt}>
                          {format(new Date(post.createdAt), 'MMMM d, yyyy')}
                        </time>
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
          )}
        </div>
      )}
    </>
  );
}
