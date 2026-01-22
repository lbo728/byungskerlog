import { notFound } from "next/navigation";
import { PostDetail } from "./PostDetail";
import { getPost, getSeriesPosts, getPrevNextPosts, getRelatedPosts, getShortPostsNav } from "@/lib/post-data";

interface PostDetailLoaderProps {
  slug: string;
  isFromShort?: boolean;
}

export async function PostDetailLoader({ slug, isFromShort = false }: PostDetailLoaderProps) {
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const [seriesPosts, { prevPost, nextPost }, relatedPosts, { prevShortPost, nextShortPost }] = await Promise.all([
    getSeriesPosts(post.seriesId),
    getPrevNextPosts(post.createdAt, post.seriesId, post.slug, isFromShort),
    getRelatedPosts(post.tags || [], post.slug, isFromShort),
    getShortPostsNav(post.createdAt, post.slug, post.type),
  ]);

  return (
    <PostDetail
      post={post}
      slug={slug}
      seriesPosts={seriesPosts}
      prevPost={prevPost}
      nextPost={nextPost}
      relatedPosts={relatedPosts}
      prevShortPost={prevShortPost}
      nextShortPost={nextShortPost}
      isFromShort={isFromShort}
    />
  );
}
