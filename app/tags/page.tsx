"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  tags: string[];
  createdAt: string;
}

export default function TagsPage() {
  const [allTags, setAllTags] = useState<{ tag: string; count: number }[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllTags();
  }, []);

  useEffect(() => {
    if (selectedTag) {
      fetchPostsByTag(selectedTag);
    } else {
      setFilteredPosts([]);
    }
  }, [selectedTag]);

  const fetchAllTags = async () => {
    try {
      const response = await fetch("/api/tags");
      const data = await response.json();
      setAllTags(data);
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPostsByTag = async (tag: string) => {
    try {
      const response = await fetch(`/api/posts?tag=${encodeURIComponent(tag)}&limit=100`);
      const data = await response.json();
      setFilteredPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts by tag:", error);
    }
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground">Loading tags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Tags</h1>

        {/* All Tags */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">All Tags ({allTags.length})</h2>
          <div className="flex flex-wrap gap-3">
            {allTags.map(({ tag, count }) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
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
              Posts tagged with "{selectedTag}" ({filteredPosts.length})
            </h2>
            <div className="grid gap-6">
              {filteredPosts.map((post) => (
                <Link key={post.id} href={`/posts/${post.slug}`} className="group">
                  <Card className="transition-colors hover:border-primary">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <time className="text-sm text-muted-foreground" dateTime={post.createdAt}>
                          {format(new Date(post.createdAt), "MMMM d, yyyy")}
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
          </div>
        )}
      </div>
    </div>
  );
}
