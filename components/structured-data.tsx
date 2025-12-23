const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

interface FAQItem {
  question: string;
  answer: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface StructuredDataProps {
  type: "website" | "blog" | "article" | "faq" | "breadcrumb";
  data?: {
    title?: string;
    description?: string;
    image?: string;
    slug?: string;
    datePublished?: string;
    dateModified?: string;
    tags?: string[];
    faqItems?: FAQItem[];
    breadcrumbs?: BreadcrumbItem[];
  };
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const getStructuredData = () => {
    const baseOrganization = {
      "@type": "Organization",
      name: "Byungsker Log",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo-byungsker.png`,
      },
    };

    const baseWebSite = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Byungsker Log",
      url: siteUrl,
      description: "제품 주도 개발을 지향하는 개발자, 이병우의 기술 블로그",
      publisher: baseOrganization,
      inLanguage: "ko-KR",
    };

    if (type === "website" || type === "blog") {
      return {
        ...baseWebSite,
        "@type": type === "blog" ? "Blog" : "WebSite",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/posts?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      };
    }

    if (type === "article" && data) {
      return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: data.title,
        description: data.description,
        image: data.image || `${siteUrl}/og-image.png`,
        datePublished: data.datePublished,
        dateModified: data.dateModified,
        author: {
          "@type": "Person",
          name: "이병우 (Byungsker)",
          url: siteUrl,
        },
        publisher: baseOrganization,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${siteUrl}/posts/${data.slug}`,
        },
        keywords: data.tags?.join(", "),
        inLanguage: "ko-KR",
      };
    }

    if (type === "faq" && data?.faqItems && data.faqItems.length > 0) {
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: data.faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      };
    }

    if (type === "breadcrumb" && data?.breadcrumbs && data.breadcrumbs.length > 0) {
      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: data.breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      };
    }

    return baseWebSite;
  };

  const structuredData = getStructuredData();

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />;
}
