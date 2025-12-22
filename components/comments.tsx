"use client";

import Giscus from "@giscus/react";
import { useTheme } from "@/components/theme-provider";

interface CommentsProps {
  slug: string;
}

export function Comments({ slug }: CommentsProps) {
  const { theme } = useTheme();

  return (
    <section className="mt-12">
      <Giscus
        id="comments"
        repo={process.env.NEXT_PUBLIC_GISCUS_REPO as `${string}/${string}`}
        repoId={process.env.NEXT_PUBLIC_GISCUS_REPO_ID!}
        category={process.env.NEXT_PUBLIC_GISCUS_CATEGORY!}
        categoryId={process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID!}
        mapping="pathname"
        term={slug}
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={theme === "dark" ? "dark" : "light"}
        lang="ko"
        loading="lazy"
      />
    </section>
  );
}
