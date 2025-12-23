import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "edge";
export const alt = "Byungsker Log Post";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let title = "Byungsker Log";
  let tags: string[] = [];
  let dateStr = "";

  try {
    const post = await prisma.post.findUnique({
      where: { slug },
      select: { title: true, tags: true, createdAt: true },
    });

    if (post) {
      title = post.title;
      tags = post.tags.slice(0, 3);
      dateStr = new Date(post.createdAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  } catch {
    // Use defaults if post not found
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #1a1a1a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1a1a1a 2%, transparent 0%)",
          backgroundSize: "100px 100px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
            }}
          >
            {tags.map((tag) => (
              <div
                key={tag}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#3b82f6",
                  borderRadius: "9999px",
                  color: "white",
                  fontSize: 18,
                  fontWeight: 500,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "white",
              lineHeight: 1.2,
              maxWidth: "900px",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {title}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="100" height="100" rx="20" fill="#3b82f6" />
              <path
                d="M25 30h50M25 50h35M25 70h45"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>
            <span
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: "white",
              }}
            >
              Byungsker Log
            </span>
          </div>
          {dateStr && (
            <span
              style={{
                fontSize: 20,
                color: "#a1a1aa",
              }}
            >
              {dateStr}
            </span>
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
