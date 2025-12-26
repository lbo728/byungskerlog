import { NextResponse } from "next/server";

interface OGData {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  url: string;
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch URL" }, { status: 502 });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json({ error: "URL is not HTML" }, { status: 400 });
    }

    const html = await response.text();

    const getMetaContent = (property: string): string | null => {
      const ogMatch = html.match(
        new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, "i")
      );
      if (ogMatch) return ogMatch[1];

      const reverseMatch = html.match(
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, "i")
      );
      if (reverseMatch) return reverseMatch[1];

      const nameMatch = html.match(
        new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, "i")
      );
      if (nameMatch) return nameMatch[1];

      const reverseNameMatch = html.match(
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, "i")
      );
      if (reverseNameMatch) return reverseNameMatch[1];

      return null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);

    const baseUrl = new URL(url);

    let image = getMetaContent("og:image") || getMetaContent("twitter:image");

    if (!image) {
      const appleTouchIcon = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']*)["']/i);
      const faviconLarge = html.match(/<link[^>]*rel=["']icon["'][^>]*sizes=["'](\d+)x\d+["'][^>]*href=["']([^"']*)["']/i);
      const favicon = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i);
      image = appleTouchIcon?.[1] || faviconLarge?.[2] || favicon?.[1] || null;
    }

    if (image) {
      image = image.replace(/^\.\//, "").replace(/\/\.\//g, "/");
    }

    if (image && !image.startsWith("http")) {
      if (image.startsWith("//")) {
        image = `https:${image}`;
      } else if (image.startsWith("/")) {
        image = `${baseUrl.origin}${image}`;
      } else {
        image = `${baseUrl.origin}/${image}`;
      }
    }

    const ogData: OGData = {
      title: getMetaContent("og:title") || (titleMatch ? titleMatch[1].trim() : null),
      description: getMetaContent("og:description") || getMetaContent("description"),
      image,
      siteName: getMetaContent("og:site_name"),
      url: url,
    };

    return NextResponse.json(ogData, {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 504 });
    }
    console.error("OG fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch OG data" }, { status: 500 });
  }
}
