"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/HoverCard";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import type { ContributionPost } from "@/app/about/page";

interface ContributionGraphProps {
  posts: ContributionPost[];
}

interface DayData {
  date: Date;
  count: number;
  level: number;
  posts: ContributionPost[];
}

export function ContributionGraph({ posts }: ContributionGraphProps) {
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 767px)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { weeks, streak, monthPositions, postsByDateKey } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    const startDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    const dateCountMap = new Map<string, number>();
    const postsByDateKey = new Map<string, ContributionPost[]>();

    posts.forEach((post) => {
      const date = new Date(post.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      dateCountMap.set(key, (dateCountMap.get(key) || 0) + 1);

      const existingPosts = postsByDateKey.get(key) || [];
      postsByDateKey.set(key, [...existingPosts, post]);
    });

    const weeks: DayData[][] = [];
    let currentWeek: DayData[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= today) {
      const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;
      const count = dateCountMap.get(key) || 0;
      const dayPosts = postsByDateKey.get(key) || [];

      currentWeek.push({
        date: new Date(currentDate),
        count,
        level: count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count >= 3 ? 3 : 0,
        posts: dayPosts,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    const monthPositions: { month: number; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0];
      if (firstDayOfWeek) {
        const month = firstDayOfWeek.date.getMonth();
        if (month !== lastMonth) {
          monthPositions.push({ month, weekIndex });
          lastMonth = month;
        }
      }
    });

    let currentStreak = 0;
    const checkDate = new Date(today);

    while (true) {
      const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      if (dateCountMap.get(key)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (currentStreak === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yesterdayKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
          if (dateCountMap.get(yesterdayKey)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    return {
      weeks,
      streak: currentStreak,
      monthPositions,
      postsByDateKey,
    };
  }, [posts]);

  const handleDayClick = useCallback(
    (day: DayData) => {
      if (day.count > 0 && isMobile) {
        setSelectedDay(day);
        setIsSheetOpen(true);
      }
    },
    [isMobile]
  );

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPostUrl = (post: ContributionPost) => {
    return post.type === "SHORT" ? `/short/${post.slug}` : `/posts/${post.slug}`;
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0:
        return "bg-muted hover:ring-1 hover:ring-muted-foreground/20";
      case 1:
        return "bg-emerald-200 dark:bg-emerald-900 hover:ring-1 hover:ring-emerald-400";
      case 2:
        return "bg-emerald-400 dark:bg-emerald-700 hover:ring-1 hover:ring-emerald-500";
      case 3:
        return "bg-emerald-600 dark:bg-emerald-500 hover:ring-1 hover:ring-emerald-700";
      default:
        return "bg-muted";
    }
  };

  const totalContributions = posts.length;

  const renderDesktopCellWithPosts = (day: DayData, dayIndex: number, cellContent: React.ReactNode) => (
    <HoverCard key={dayIndex} openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{cellContent}</HoverCardTrigger>
      <HoverCardContent className="contribution-hovercard w-72 p-3" side="top" align="center">
        <div className="hovercard-header mb-2">
          <p className="hovercard-date text-sm font-medium">{formatDate(day.date)}</p>
          <p className="hovercard-count text-xs text-muted-foreground">{day.count}개의 글 발행</p>
        </div>
        <ul className="hovercard-posts-list space-y-1.5">
          {day.posts.map((post) => (
            <li key={post.id} className="hovercard-post-item">
              <Link
                href={getPostUrl(post)}
                className="hovercard-post-link flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <span className="post-type-badge shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded bg-muted">
                  {post.type === "SHORT" ? "Short" : "Post"}
                </span>
                <span className="post-title truncate">{post.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );

  const renderDesktopEmptyCell = (day: DayData, dayIndex: number, cellContent: React.ReactNode) => (
    <HoverCard key={dayIndex} openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{cellContent}</HoverCardTrigger>
      <HoverCardContent className="contribution-hovercard-empty w-auto p-2" side="top" align="center">
        <p className="text-xs text-muted-foreground">{formatDate(day.date)}</p>
        <p className="text-xs">발행된 글 없음</p>
      </HoverCardContent>
    </HoverCard>
  );

  const renderDayCell = (day: DayData, dayIndex: number) => {
    const cellContent = (
      <div
        className={`day-cell w-[12px] h-[12px] rounded-[2px] transition-all cursor-pointer ${getLevelColor(day.level)}`}
        onClick={() => handleDayClick(day)}
      />
    );

    if (isMobile) {
      return <div key={dayIndex}>{cellContent}</div>;
    }

    if (day.count > 0) {
      return renderDesktopCellWithPosts(day, dayIndex, cellContent);
    }

    return renderDesktopEmptyCell(day, dayIndex, cellContent);
  };

  return (
    <>
      <div className="contribution-graph-wrapper">
        <div className="contribution-graph-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h3 className="text-lg font-semibold">글 발행 기록</h3>
          {streak > 0 && (
            <div className="streak-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
              <span className="text-base">🔥</span>
              <span>{streak}일째 포스팅 중</span>
            </div>
          )}
        </div>
        <div
          ref={scrollContainerRef}
          className="contribution-graph-container w-full overflow-x-auto scrollbar-hidden hover:scrollbar-visible"
        >
          <div className="contribution-graph min-w-[700px] sm:min-w-0 sm:w-full">
            <div className="graph-with-labels flex">
              <div className="day-labels flex flex-col text-[10px] text-muted-foreground pr-2 pt-4">
                {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                  <span
                    key={dayIndex}
                    className="h-[12px] sm:h-[calc((100%-2px*6)/7)] flex items-center"
                    style={{ marginBottom: dayIndex < 6 ? "2px" : 0 }}
                  >
                    {dayIndex % 2 === 1 ? dayLabels[dayIndex] : ""}
                  </span>
                ))}
              </div>
              <div className="graph-main flex-1">
                <div
                  className="month-labels grid text-[10px] text-muted-foreground mb-1"
                  style={{
                    gridTemplateColumns: `repeat(${weeks.length}, 12px)`,
                    gap: "2px",
                  }}
                >
                  {weeks.map((_, weekIndex) => {
                    const monthData = monthPositions.find((m) => m.weekIndex === weekIndex);
                    return (
                      <span key={weekIndex} className="text-left whitespace-nowrap">
                        {monthData ? monthLabels[monthData.month] : ""}
                      </span>
                    );
                  })}
                </div>
                <div
                  className="graph-grid grid"
                  style={{
                    gridTemplateColumns: `repeat(${weeks.length}, 12px)`,
                    gap: "2px",
                  }}
                >
                  {weeks.map((week, weekIndex) => (
                    <div
                      key={weekIndex}
                      className="week-column grid"
                      style={{
                        gridTemplateRows: "repeat(7, 12px)",
                        gap: "2px",
                      }}
                    >
                      {week.map((day, dayIndex) => renderDayCell(day, dayIndex))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="graph-legend flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>{totalContributions}개의 글 발행</span>
              <div className="legend-items flex items-center gap-1">
                <span className="mr-1">Less</span>
                <div className="w-[10px] h-[10px] rounded-[2px] bg-muted" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-200 dark:bg-emerald-900" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-400 dark:bg-emerald-700" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-600 dark:bg-emerald-500" />
                <span className="ml-1">More</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="contribution-sheet h-auto max-h-[60vh]">
          <SheetHeader className="sheet-header pb-4">
            <SheetTitle className="sheet-title text-left">
              {selectedDay && (
                <>
                  <span className="sheet-date block">{formatDate(selectedDay.date)}</span>
                  <span className="sheet-count block text-sm font-normal text-muted-foreground">
                    {selectedDay.count}개의 글 발행
                  </span>
                </>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="sheet-posts-container overflow-y-auto">
            {selectedDay && selectedDay.posts.length > 0 && (
              <ul className="sheet-posts-list space-y-2">
                {selectedDay.posts.map((post) => (
                  <li key={post.id} className="sheet-post-item">
                    <Link
                      href={getPostUrl(post)}
                      className="sheet-post-link flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      <span className="post-type-badge shrink-0 px-2 py-1 text-xs font-medium rounded bg-muted-foreground/10">
                        {post.type === "SHORT" ? "Short" : "Post"}
                      </span>
                      <span className="post-title text-sm">{post.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
