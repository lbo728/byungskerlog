import { NextResponse } from "next/server";

interface BookResult {
  title: string;
  author: string;
  isbn: string;
  coverImage: string;
  publisher: string;
  publishDate: string;
  description: string;
}

interface SearchResponse {
  results: BookResult[];
  total: number;
}

interface AladinItem {
  title: string;
  author: string;
  isbn13: string;
  cover: string;
  publisher: string;
  pubDate: string;
  description: string;
}

interface AladinResponse {
  item: AladinItem[];
  totalResults: number;
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim() === "") {
    return NextResponse.json({ error: "Search query is required" }, { status: 400 });
  }

  const apiKey = process.env.ALADIN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const params = new URLSearchParams({
      ttbkey: apiKey,
      Query: query.trim(),
      QueryType: "Title",
      MaxResults: "10",
      SearchTarget: "Book",
      output: "js",
      Version: "20131101",
      Cover: "Big",
    });

    const response = await fetch(`http://www.aladin.co.kr/ttb/api/ItemSearch.aspx?${params}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BookSearch/1.0)",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch from Aladin API" }, { status: 502 });
    }

    const data: AladinResponse = await response.json();

    const results: BookResult[] = (data.item || []).map((item) => ({
      title: item.title.replace(/\s*-\s*.*$/, "").trim(),
      author: item.author.replace(/\s*\(지은이\)\s*$/, "").trim(),
      isbn: item.isbn13,
      coverImage: item.cover,
      publisher: item.publisher,
      publishDate: item.pubDate,
      description: item.description,
    }));

    return NextResponse.json(
      {
        results,
        total: data.totalResults || 0,
      } as SearchResponse,
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 504 });
    }
    console.error("Book search error:", error);
    return NextResponse.json({ error: "Failed to search books" }, { status: 500 });
  }
}
