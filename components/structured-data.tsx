import type { Post } from '@/lib/types';

interface StructuredDataProps {
  post: Post;
}

export function StructuredData({ post }: StructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://byungsker.com';
  const postUrl = `${baseUrl}/posts/${post.slug}`;

  // 마크다운에서 첫 번째 이미지 추출
  const imageMatch = post.content.match(/!\[.*?\]\((.*?)\)/);
  const firstImage = imageMatch ? imageMatch[1] : `${baseUrl}/og-image.png`;
  const absoluteImageUrl = firstImage.startsWith('http') ? firstImage : `${baseUrl}${firstImage}`;

  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.content.slice(0, 160).replace(/[#*`\[\]]/g, ''),
    image: absoluteImageUrl,
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: 'Byungsker',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Byungsker Log',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
  };

  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: post.title,
        item: postUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />
    </>
  );
}
