import type { Post, ShortPost } from "./post";

/**
 * Pagination metadata for list responses
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Generic list response with pagination
 */
export interface ListResponse<T> {
  items: T[];
  pagination: Pagination;
}

/**
 * Posts list response from /api/posts
 */
export interface PostsResponse {
  posts: Post[];
  pagination: Pagination;
}

/**
 * Short posts list response
 */
export interface ShortPostsResponse {
  posts: ShortPost[];
  pagination: Pagination;
}

/**
 * Create post request/mutation data
 */
export interface CreatePostData {
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  thumbnail?: string | null;
  tags?: string[];
  type?: "LONG" | "SHORT";
  published?: boolean;
  seriesId?: string | null;
}

/**
 * Update post request/mutation data
 */
export interface UpdatePostData {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string | null;
  thumbnail?: string | null;
  tags?: string[];
  type?: "LONG" | "SHORT";
  published?: boolean;
  seriesId?: string | null;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}
