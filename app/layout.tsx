import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Providers } from "./providers";
import { StructuredData } from "@/components/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Byungsker Log",
    template: "%s | Byungsker Log",
  },
  description: "제품 주도 개발을 지향하는 개발자, 이병우의 기술 블로그. 소프트웨어 개발, 제품 개발, 스타트업에 대한 인사이트를 공유합니다.",
  keywords: ["개발 블로그", "소프트웨어 개발", "제품 주도 개발", "Product-Led Development", "이병우", "Byungsker", "스타트업", "기술 블로그"],
  authors: [{ name: "이병우 (Byungsker)" }],
  creator: "이병우 (Byungsker)",
  publisher: "이병우 (Byungsker)",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    alternateLocale: ["en_US"],
    url: siteUrl,
    siteName: "Byungsker Log",
    title: "Byungsker Log",
    description: "제품 주도 개발을 지향하는 개발자, 이병우의 기술 블로그. 소프트웨어 개발, 제품 개발, 스타트업에 대한 인사이트를 공유합니다.",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Byungsker Log",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Byungsker Log",
    description: "제품 주도 개발을 지향하는 개발자, 이병우의 기술 블로그",
    images: [`${siteUrl}/og-image.png`],
    creator: "@byungsker",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adSenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", geistSans.variable, geistMono.variable)}>
        <StructuredData type="blog" />
        {adSenseClientId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClientId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        <StackProvider app={stackClientApp}>
          <StackTheme>
            <ThemeProvider>
              <Providers>
                <div className="relative flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </Providers>
            </ThemeProvider>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
