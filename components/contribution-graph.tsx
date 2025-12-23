"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ContributionGraphProps {
  postDates: string[];
}

interface DayData {
  date: Date;
  count: number;
  level: number;
}

export function ContributionGraph({ postDates }: ContributionGraphProps) {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const monthLabels = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  const { weeks, streak, monthPositions } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    const startDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    const dateCountMap = new Map<string, number>();
    postDates.forEach((dateStr) => {
      const date = new Date(dateStr);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      dateCountMap.set(key, (dateCountMap.get(key) || 0) + 1);
    });

    const weeks: DayData[][] = [];
    let currentWeek: DayData[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= today) {
      const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;
      const count = dateCountMap.get(key) || 0;

      currentWeek.push({
        date: new Date(currentDate),
        count,
        level: count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count >= 3 ? 3 : 0,
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
    };
  }, [postDates]);

  const handleMouseEnter = (day: DayData, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredDay(day);
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  const totalContributions = postDates.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="contribution-graph-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg">글 발행 기록</CardTitle>
          {streak > 0 && (
            <div className="streak-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
              <span className="text-base">🔥</span>
              <span>{streak}일째 포스팅 중</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="contribution-graph-container w-full">
          <div className="contribution-graph w-full">
            <div className="graph-with-labels flex">
              <div className="day-labels flex flex-col justify-around text-[10px] text-muted-foreground pr-2 pt-4">
                {[1, 3, 5].map((dayIndex) => (
                  <span key={dayIndex} className="h-[calc((100%-2px*6)/7)] flex items-center">
                    {dayLabels[dayIndex]}
                  </span>
                ))}
              </div>
              <div className="graph-main flex-1">
                <div
                  className="month-labels grid text-[10px] text-muted-foreground mb-1"
                  style={{
                    gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
                  }}
                >
                  {weeks.map((_, weekIndex) => {
                    const monthData = monthPositions.find((m) => m.weekIndex === weekIndex);
                    return (
                      <span key={weekIndex} className="text-left">
                        {monthData ? monthLabels[monthData.month] : ""}
                      </span>
                    );
                  })}
                </div>
                <div
                  className="graph-grid grid w-full"
                  style={{
                    gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
                    gap: '2px',
                  }}
                >
                  {weeks.map((week, weekIndex) => (
                    <div
                      key={weekIndex}
                      className="week-column grid"
                      style={{
                        gridTemplateRows: 'repeat(7, 1fr)',
                        gap: '2px',
                      }}
                    >
                      {week.map((day, dayIndex) => (
                        <div
                          key={dayIndex}
                          className={`day-cell aspect-square rounded-[2px] transition-all cursor-pointer ${getLevelColor(day.level)}`}
                          onMouseEnter={(e) => handleMouseEnter(day, e)}
                          onMouseLeave={handleMouseLeave}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="graph-legend flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>{totalContributions}개의 글 발행</span>
              <div className="legend-items flex items-center gap-1">
                <span className="mr-1">적음</span>
                <div className="w-[10px] h-[10px] rounded-[2px] bg-muted" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-200 dark:bg-emerald-900" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-400 dark:bg-emerald-700" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-600 dark:bg-emerald-500" />
                <span className="ml-1">많음</span>
              </div>
            </div>
          </div>
        </div>

        {hoveredDay && (
          <div
            className="tooltip-popup fixed z-50 px-2 py-1 text-xs bg-popover text-popover-foreground rounded shadow-lg border pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
            }}
          >
            <div className="font-medium">
              {hoveredDay.count > 0
                ? `${hoveredDay.count}개의 글 발행`
                : "발행된 글 없음"}
            </div>
            <div className="text-muted-foreground">{formatDate(hoveredDay.date)}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
