"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { PullToRefresh } from "@/components/common/PullToRefresh";

interface HomeClientWrapperProps {
  children: React.ReactNode;
}

export function HomeClientWrapper({ children }: HomeClientWrapperProps) {
  const router = useRouter();

  const handleRefresh = useCallback(async () => {
    router.refresh();
    await new Promise((resolve) => setTimeout(resolve, 500));
  }, [router]);

  return <PullToRefresh onRefresh={handleRefresh}>{children}</PullToRefresh>;
}
