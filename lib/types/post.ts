/**
 * Series type definition
 */
export interface Series {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count?: {
    posts: number;
  };
}

/**
 * Post type definition matching Prisma schema
 * Used across the application for type safety
 * Note: Dates can be Date objects or ISO strings depending on serialization context
 */
export interface Post {
  id: string;
  slug: string;
  subSlug?: string | null;
  title: string;
  content: string;
  excerpt: string | null;
  thumbnail: string | null;
  tags: string[];
  type?: "LONG" | "SHORT";
  published?: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
  series?: Series | null;
  totalViews?: number;
  dailyViews?: number;
}

/**
 * Post type for list views (excludes full content for performance)
 */
export interface PostPreview {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  thumbnail: string | null;
  tags: string[];
  type?: "LONG" | "SHORT";
  createdAt: Date | string;
  series?: Series | null;
  totalViews?: number;
}

/**
 * Alias for Post used in home page contexts
 */
export type HomePost = Post;

/**
 * Short Post type (subset of Post with type="SHORT")
 */
export interface ShortPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  tags: string[];
  createdAt: Date | string;
  series?: Series | null;
}
