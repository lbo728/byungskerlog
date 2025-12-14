"use client";

import { useEffect, useState } from "react";
import { useUser } from "@stackframe/stack";
import { Users } from "lucide-react";

interface VisitorStats {
  today: number;
  total: number;
}

export function VisitorCount() {
  const user = useUser();
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only fetch if user is logged in
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/visitors");
        if (!response.ok) throw new Error("Failed to fetch visitor stats");
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching visitor stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

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
