"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, Pencil, Eye } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/HoverCard";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface CalendarPost {
  id: string;
  title: string;
  slug: string;
  type: "LONG" | "SHORT";
  published: boolean;
  createdAt: string;
}

interface AdminCalendarProps {
  posts: CalendarPost[];
  onPostClick?: (post: CalendarPost) => void;
}

interface DayPostData {
  count: number;
  posts: CalendarPost[];
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function AdminCalendar({ posts, onPostClick }: AdminCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 767px)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const postsByDate = useMemo(() => {
    const map = new Map<string, DayPostData>();

    posts.forEach((post) => {
      const date = new Date(post.createdAt);
      const key = format(date, "yyyy-MM-dd");
      const existing = map.get(key) || { count: 0, posts: [] };
      map.set(key, {
        count: existing.count + 1,
        posts: [...existing.posts, post],
      });
    });

    return map;
  }, [posts]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const selectedDatePosts = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return postsByDate.get(key)?.posts || [];
  }, [selectedDate, postsByDate]);

  const getLevelColor = useCallback((count: number): string => {
    if (count === 0) return "";
    if (count === 1) return "bg-emerald-200 dark:bg-emerald-900";
    if (count === 2) return "bg-emerald-400 dark:bg-emerald-700";
    return "bg-emerald-600 dark:bg-emerald-500";
  }, []);

  const formatDateKorean = useCallback((date: Date) => {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  }, []);

  const getPostUrl = useCallback((post: CalendarPost) => {
    return post.type === "SHORT" ? `/short/${post.slug}` : `/posts/${post.slug}`;
  }, []);

  const getEditUrl = useCallback((post: CalendarPost) => {
    return `/admin/write?id=${post.id}`;
  }, []);

  const handleDayClick = useCallback(
    (date: Date) => {
      const key = format(date, "yyyy-MM-dd");
      const dayData = postsByDate.get(key);

      setSelectedDate(date);

      if (dayData && dayData.count > 0 && isMobile) {
        setIsSheetOpen(true);
      }
    },
    [postsByDate, isMobile]
  );

  const handlePostClick = useCallback(
    (post: CalendarPost) => {
      onPostClick?.(post);
      setIsSheetOpen(false);
    },
    [onPostClick]
  );

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  }, []);

  const renderPostItem = useCallback(
    (post: CalendarPost, showActions: boolean = false) => (
      <li key={post.id} className="post-list-item">
        <div
          className={cn(
            "post-item-content flex items-center gap-3 p-2 rounded-lg",
            showActions ? "hover:bg-muted transition-colors" : ""
          )}
        >
          <span
            className={cn(
              "post-type-badge shrink-0 px-2 py-0.5 text-[11px] font-medium rounded-full",
              post.type === "SHORT"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
            )}
          >
            {post.type === "SHORT" ? "Short" : "Long"}
          </span>
          <span className="post-title flex-1 text-sm truncate" title={post.title}>
            {post.title}
          </span>
          <span
            className={cn(
              "post-status-badge shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded",
              post.published
                ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            )}
          >
            {post.published ? "발행됨" : "임시저장"}
          </span>
          {showActions && (
            <div className="post-actions flex items-center gap-1">
              <Link
                href={getEditUrl(post)}
                className="edit-link p-1.5 rounded-md hover:bg-muted-foreground/10 transition-colors"
                title="편집"
                onClick={() => handlePostClick(post)}
              >
                <Pencil className="size-3.5 text-muted-foreground" />
              </Link>
              {post.published && (
                <Link
                  href={getPostUrl(post)}
                  className="view-link p-1.5 rounded-md hover:bg-muted-foreground/10 transition-colors"
                  title="보기"
                  target="_blank"
                >
                  <Eye className="size-3.5 text-muted-foreground" />
                </Link>
              )}
            </div>
          )}
        </div>
      </li>
    ),
    [getEditUrl, getPostUrl, handlePostClick]
  );

  const renderDayCell = useCallback(
    (date: Date) => {
      const key = format(date, "yyyy-MM-dd");
      const dayData = postsByDate.get(key);
      const count = dayData?.count || 0;
      const dayPosts = dayData?.posts || [];
      const isSelected = selectedDate && isSameDay(date, selectedDate);
      const isToday = isSameDay(date, new Date());
      const isCurrentMonth = isSameMonth(date, currentMonth);

      const dayButton = (
        <button
          type="button"
          onClick={() => handleDayClick(date)}
          className={cn(
            "day-cell relative w-full aspect-square flex flex-col items-center justify-start pt-1 rounded-md transition-all",
            isSelected && "ring-2 ring-primary ring-offset-1",
            isToday && !isSelected && "ring-1 ring-muted-foreground/30",
            count > 0 && "cursor-pointer hover:bg-accent/50",
            !isCurrentMonth && "opacity-40"
          )}
        >
          <span
            className={cn(
              "day-number text-sm font-medium",
              isToday && "text-primary font-bold",
              isSelected && "text-primary"
            )}
          >
            {date.getDate()}
          </span>
          {count > 0 && (
            <div className="post-indicators flex items-center justify-center gap-0.5 mt-1">
              {Array.from({ length: Math.min(count, 3) }).map((_, idx) => (
                <div key={idx} className={cn("post-dot size-1.5 rounded-full", getLevelColor(count))} />
              ))}
              {count > 3 && (
                <span className="post-more-indicator text-[9px] text-muted-foreground ml-0.5">+{count - 3}</span>
              )}
            </div>
          )}
        </button>
      );

      if (!isMobile && count > 0) {
        return (
          <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>{dayButton}</HoverCardTrigger>
            <HoverCardContent className="day-hovercard w-80 p-3" side="top" align="center">
              <div className="hovercard-header mb-2">
                <p className="hovercard-date text-sm font-medium">{formatDateKorean(date)}</p>
                <p className="hovercard-count text-xs text-muted-foreground">{count}개의 글</p>
              </div>
              <ul className="hovercard-posts-list space-y-1 max-h-48 overflow-y-auto">
                {dayPosts.map((post) => renderPostItem(post, false))}
              </ul>
            </HoverCardContent>
          </HoverCard>
        );
      }

      return dayButton;
    },
    [postsByDate, selectedDate, currentMonth, handleDayClick, getLevelColor, formatDateKorean, isMobile, renderPostItem]
  );

  const monthlyStats = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    let totalPosts = 0;
    let publishedPosts = 0;
    let draftPosts = 0;

    postsByDate.forEach((data, dateKey) => {
      const date = new Date(dateKey);
      if (date >= monthStart && date <= monthEnd) {
        totalPosts += data.count;
        data.posts.forEach((post) => {
          if (post.published) publishedPosts++;
          else draftPosts++;
        });
      }
    });

    return { totalPosts, publishedPosts, draftPosts };
  }, [currentMonth, postsByDate]);

  return (
    <>
      <div className="admin-calendar-container w-full">
        <div className="calendar-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="header-left flex items-center gap-2">
            <CalendarDays className="size-5 text-muted-foreground shrink-0" />
            <h3 className="text-lg font-semibold whitespace-nowrap">발행 캘린더</h3>
          </div>
          <div className="header-right flex items-center justify-between sm:justify-end gap-2">
            <Button variant="outline" size="sm" onClick={goToToday} className="shrink-0">
              오늘
            </Button>
            <div className="month-nav flex items-center gap-0.5 sm:gap-1">
              <Button variant="ghost" size="icon-sm" onClick={goToPreviousMonth} aria-label="이전 달">
                <ChevronLeft className="size-4" />
              </Button>
              <span className="month-label min-w-[100px] sm:min-w-[120px] text-center font-medium text-sm sm:text-base">
                {format(currentMonth, "yyyy년 M월", { locale: ko })}
              </span>
              <Button variant="ghost" size="icon-sm" onClick={goToNextMonth} aria-label="다음 달">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="monthly-stats flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-xs sm:text-sm">
          <div className="stat-item flex items-center gap-1.5">
            <div className="stat-dot size-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">총 {monthlyStats.totalPosts}개</span>
          </div>
          <div className="stat-item flex items-center gap-1.5">
            <div className="stat-dot size-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">발행 {monthlyStats.publishedPosts}개</span>
          </div>
          <div className="stat-item flex items-center gap-1.5">
            <div className="stat-dot size-2 rounded-full bg-gray-400" />
            <span className="text-muted-foreground">임시저장 {monthlyStats.draftPosts}개</span>
          </div>
        </div>

        <div className="calendar-wrapper rounded-lg border bg-card p-4">
          <div className="calendar-grid">
            <div className="weekday-header grid grid-cols-7 mb-2">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="weekday-cell text-center text-sm text-muted-foreground font-normal py-2">
                  {label}
                </div>
              ))}
            </div>
            <div className="days-grid grid grid-cols-7 gap-1">
              {calendarDays.map((date) => (
                <div key={date.toISOString()} className="day-wrapper">
                  {renderDayCell(date)}
                </div>
              ))}
            </div>
          </div>

          <div className="calendar-legend flex items-center justify-end gap-2 mt-4 pt-4 border-t text-xs text-muted-foreground">
            <span>글 수:</span>
            <div className="legend-items flex items-center gap-1">
              <div className="size-3 rounded-sm bg-muted" title="0개" />
              <div className="size-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" title="1개" />
              <div className="size-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" title="2개" />
              <div className="size-3 rounded-sm bg-emerald-600 dark:bg-emerald-500" title="3개 이상" />
            </div>
          </div>
        </div>

        {!isMobile && selectedDate && selectedDatePosts.length > 0 && (
          <div className="selected-date-panel mt-4 rounded-lg border bg-card p-4">
            <div className="panel-header mb-3">
              <h4 className="text-base font-semibold">{formatDateKorean(selectedDate)}</h4>
              <p className="text-sm text-muted-foreground">{selectedDatePosts.length}개의 글</p>
            </div>
            <ul className="panel-posts-list space-y-1">
              {selectedDatePosts.map((post) => renderPostItem(post, true))}
            </ul>
          </div>
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="calendar-sheet h-auto max-h-[70vh]">
          <SheetHeader className="sheet-header pb-4">
            <SheetTitle className="sheet-title text-left">
              {selectedDate && (
                <>
                  <span className="sheet-date block">{formatDateKorean(selectedDate)}</span>
                  <span className="sheet-count block text-sm font-normal text-muted-foreground">
                    {selectedDatePosts.length}개의 글
                  </span>
                </>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="sheet-posts-container overflow-y-auto px-1">
            {selectedDatePosts.length > 0 && (
              <ul className="sheet-posts-list space-y-2">
                {selectedDatePosts.map((post) => renderPostItem(post, true))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export type { CalendarPost, AdminCalendarProps };
