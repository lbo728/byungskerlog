"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@stackframe/stack";
import { Users } from "lucide-react";

interface VisitorStats {
  today: number;
  total: number;
}

async function fetchVisitorStats(): Promise<VisitorStats> {
  const response = await fetch("/api/visitors");
  if (!response.ok) throw new Error("Failed to fetch visitor stats");
  return response.json();
}

export function VisitorCount() {
  const user = useUser();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["visitor-stats"],
    queryFn: fetchVisitorStats,
    enabled: !!user, // 로그인한 경우에만 쿼리 실행
    staleTime: 30 * 1000, // 30초간 fresh 상태 유지
    refetchInterval: 60 * 1000, // 1분마다 자동 갱신
    refetchOnWindowFocus: true, // 윈도우 포커스 시 재검증
    retry: 1, // 실패 시 1회만 재시도
  });

  // Don't render if user is not logged in
  if (!user) return null;

  // Don't render while loading
  if (isLoading) return null;

  // Don't render if stats failed to load
  if (!stats) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Users className="h-3.5 w-3.5" />
      <span>
        Today: {stats.today} / Total: {stats.total}
      </span>
    </div>
  );
}
