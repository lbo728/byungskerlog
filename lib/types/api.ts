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
 * Create post request body
 */
export interface CreatePostRequest {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  thumbnail?: string;
  tags?: string[];
  type?: "LONG" | "SHORT";
  published?: boolean;
  seriesId?: string;
}

/**
 * Update post request body
 */
export interface UpdatePostRequest {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  thumbnail?: string;
  tags?: string[];
  type?: "LONG" | "SHORT";
  published?: boolean;
  seriesId?: string;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}
