import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/handler/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/handler/"],
      },
      {
        userAgent: "Yeti",
        allow: "/",
        disallow: ["/admin/", "/api/", "/handler/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
