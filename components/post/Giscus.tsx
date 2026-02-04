"use client";

import GiscusComponent from "@giscus/react";

interface GiscusProps {
  slug: string; // 포스트 slug를 mapping에 사용
}

export function Giscus({ slug }: GiscusProps) {
  return (
    <GiscusComponent
      repo="byungsker/byungskerlog-comments"
      repoId="R_kgDOK..."
      category="Comments"
      categoryId="DIC_kwDOK..."
      mapping="specific"
      term={slug}
      strict="0"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="top"
      theme="preferred_color_scheme"
      lang="ko"
    />
  );
}
