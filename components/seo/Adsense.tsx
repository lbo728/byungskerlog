"use client";

import { useEffect, useRef, useState } from "react";
import { useIsAdmin } from "@/lib/client-auth";

interface AdSenseProps {
  adSlot: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

type WindowWithAdsbygoogle = Window & { adsbygoogle?: unknown[] };

export function AdSense({ adSlot, adFormat = "auto", fullWidthResponsive = true, style, className }: AdSenseProps) {
  const adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const isAdmin = useIsAdmin();
  const [mounted, setMounted] = useState(false);
  const pushRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !adClient || pushRef.current) return;

    try {
      const isInIframe = typeof window !== "undefined" && window.self !== window.top;
      if (isInIframe) return;

      const windowWithAds = window as WindowWithAdsbygoogle;
      (windowWithAds.adsbygoogle = windowWithAds.adsbygoogle || []).push({});
      pushRef.current = true;
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, [mounted, adClient]);

  if (!mounted || !adClient || isAdmin) {
    return null;
  }

  return (
    <div className={className} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  );
}
