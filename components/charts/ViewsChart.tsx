"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface ViewsChartProps {
  data: { title: string; slug: string; views: number }[];
  isLoading?: boolean;
}

const chartConfig = {
  views: {
    label: "조회수",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

function truncateTitle(title: string, maxLen = 8): string {
  const withoutPrefix = title.replace(/^\[[\w-]+\]\s*/i, "");
  if (withoutPrefix.length <= maxLen) return withoutPrefix;
  return withoutPrefix.slice(0, maxLen) + "...";
}

export function ViewsChart({ data, isLoading }: ViewsChartProps) {
  if (isLoading) {
    return (
      <div className="views-chart-loading h-[400px] flex items-center justify-center text-muted-foreground">
        로딩 중...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="views-chart-empty h-[400px] flex items-center justify-center text-muted-foreground">
        데이터가 없습니다.
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    displayTitle: truncateTitle(item.title),
  }));

  return (
    <ChartContainer config={chartConfig} className="views-chart h-[400px] w-full">
      <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 50, left: 80, bottom: 20 }}>
        <defs>
          <linearGradient id="viewsBarGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a8a8a8" />
            <stop offset="100%" stopColor="#686868" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="displayTitle"
          width={80}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip
          cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.3 }}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name, props) => (
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{props.payload?.title}</span>
                  <span className="text-muted-foreground">{value}회 조회</span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="views" fill="url(#viewsBarGradient)" radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="views"
            position="right"
            formatter={(value: number) => `${value}회`}
            className="fill-foreground text-[11px] font-medium"
            offset={8}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
