/**
 * Central type exports for the application
 * Import types from @/lib/types instead of individual files
 */

// Post and related types
export type {
  Post,
  PostPreview,
  HomePost,
  ShortPost,
  Series,
} from "./post";

// API types
export type {
  Pagination,
  ListResponse,
  PostsResponse,
  ShortPostsResponse,
  CreatePostData,
  UpdatePostData,
  ApiErrorResponse,
} from "./api";
