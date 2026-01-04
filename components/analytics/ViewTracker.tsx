"use client";

import { useEffect } from "react";

interface ViewTrackerProps {
  slug: string;
}

export function ViewTracker({ slug }: ViewTrackerProps) {
  useEffect(() => {
    // Record view
    const recordView = async () => {
      try {
        await fetch(`/api/posts-by-slug/${slug}/views`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Failed to record view:", error);
      }
    };

    recordView();
  }, [slug]);

  return null;
}
