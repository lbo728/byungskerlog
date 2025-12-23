import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Byungsker Log - 제품 주도 개발을 지향하는 개발자의 기술 블로그";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
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
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
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
              width="64"
              height="64"
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
                fontSize: 64,
                fontWeight: 700,
                color: "white",
                letterSpacing: "-0.02em",
              }}
            >
              Byungsker Log
            </span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#a1a1aa",
              textAlign: "center",
              maxWidth: "800px",
              lineHeight: 1.4,
            }}
          >
            제품 주도 개발을 지향하는 개발자의 기술 블로그
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "16px",
            }}
          >
            {["소프트웨어 개발", "제품 개발", "스타트업"].map((tag) => (
              <div
                key={tag}
                style={{
                  padding: "8px 20px",
                  backgroundColor: "#27272a",
                  borderRadius: "9999px",
                  color: "#e4e4e7",
                  fontSize: 18,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#71717a",
            fontSize: 18,
          }}
        >
          <span>byungskerlog.vercel.app</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
