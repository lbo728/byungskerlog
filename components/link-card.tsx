"use client";

import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";

interface OGData {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  url: string;
}

interface LinkCardProps {
  url: string;
}

export function LinkCard({ url }: LinkCardProps) {
  const [ogData, setOgData] = useState<OGData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchOgData = async () => {
      try {
        const response = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setOgData(data);
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOgData();
  }, [url]);

  const hostname = (() => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  })();

  if (error) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="link-card-fallback inline-flex items-center gap-1 text-primary hover:underline"
      >
        {url}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  if (isLoading) {
    return (
      <div className="link-card-skeleton my-4 flex overflow-hidden rounded-lg border border-border bg-muted/30 animate-pulse">
        <div className="flex-1 p-4 space-y-2">
          <div className="h-5 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-1/4" />
        </div>
        <div className="hidden sm:block w-[200px] h-[120px] bg-muted" />
      </div>
    );
  }

  if (!ogData) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="link-card-fallback inline-flex items-center gap-1 text-primary hover:underline"
      >
        {url}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="link-card my-4 flex overflow-hidden rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors no-underline"
    >
      <div className="link-card-content flex-1 p-4 min-w-0">
        <h4 className="link-card-title font-semibold text-foreground line-clamp-1 mb-1">
          {ogData.title || hostname}
        </h4>
        {ogData.description && (
          <p className="link-card-description text-sm text-muted-foreground line-clamp-2 mb-2">
            {ogData.description}
          </p>
        )}
        <div className="link-card-meta flex items-center gap-1 text-xs text-muted-foreground">
          <ExternalLink className="h-3 w-3" />
          <span className="truncate">{ogData.siteName || hostname}</span>
        </div>
      </div>
      {ogData.image && (
        <div className="link-card-image hidden sm:block w-[200px] h-[120px] flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ogData.image}
            alt={ogData.title || ""}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
    </a>
  );
}
