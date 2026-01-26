"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { PullToRefresh } from "@/components/common/PullToRefresh";

interface PageRefreshWrapperProps {
  children: React.ReactNode;
}

export function PageRefreshWrapper({ children }: PageRefreshWrapperProps) {
  const router = useRouter();

  const handleRefresh = useCallback(async () => {
    router.refresh();
    await new Promise((resolve) => setTimeout(resolve, 500));
  }, [router]);

  return <PullToRefresh onRefresh={handleRefresh}>{children}</PullToRefresh>;
}
