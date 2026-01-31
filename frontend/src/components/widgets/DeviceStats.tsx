"use client";

import * as React from "react";
import { Pie, PieChart, Label } from "recharts";
import {
  Widget,
  WidgetContent,
  WidgetFooter,
  WidgetHeader,
  WidgetTitle,
} from "@/components/ui/widget";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { device: "Human", visitors: 45, fill: "#6366f1" }, // Indigo
  { device: "AI Agent", visitors: 85, fill: "#e11d48" }, // Rose
];

const chartConfig = {
  visitors: { label: "Interactions" },
  desktop: { label: "Human", color: "#6366f1" },
  mobile: { label: "AI Agent", color: "#e11d48" },
} satisfies ChartConfig;

interface DeviceStatsProps {
  data?: Array<{ name: string; value: number; fill: string }>;
}

export default function DeviceStats({ data }: DeviceStatsProps) {
  // Fallback if no data provided
  const chartData = data || [
      { name: 'Positive', value: 400, fill: '#10b981' },
      { name: 'Neutral', value: 300, fill: '#6366f1' },
      { name: 'Negative', value: 300, fill: '#f43f5e' },
  ];

  const total = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  return (
    <Widget className="gap-0 w-full h-full" design="mumbai">
      <WidgetHeader className="items-center pb-2">
        <WidgetTitle className="text-sm font-medium text-slate-500 uppercase tracking-widest">Sentiment Distribution</WidgetTitle>
      </WidgetHeader>
      <WidgetContent className="flex-1 min-h-0 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-slate-900 text-3xl font-bold"
                        >
                          {total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-slate-500 text-xs text-muted-foreground uppercase tracking-widest"
                        >
                          Calls
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </WidgetContent>
      <WidgetFooter className="flex-col gap-2 text-sm pt-4">
         {chartData.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm w-full">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-slate-600">{item.name}</span>
               </div>
               <span className="font-medium text-slate-900">{item.value}</span>
            </div>
         ))}
      </WidgetFooter>
    </Widget>
  );
}
