"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ViewsChartProps {
  data: { title: string; slug: string; views: number }[];
  isLoading?: boolean;
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

  return (
    <div className="views-chart h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 120, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" className="text-xs" />
          <YAxis type="category" dataKey="title" className="text-xs" width={120} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value) => [`${value}회`, "조회수"]}
          />
          <Bar dataKey="views" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
