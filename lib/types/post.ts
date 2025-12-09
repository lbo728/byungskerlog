/**
 * Post type definition matching Prisma schema
 * Used across the application for type safety
 */
export interface Post {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Post type for list views (excludes full content)
 */
export interface PostPreview {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  createdAt: Date;
  updatedAt: Date;
}
