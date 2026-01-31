"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, Area, AreaChart } from "recharts";
import {
  Widget,
  WidgetContent,
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
  { time: "9am", performance: 45, confidence: 80 },
  { time: "10am", performance: 75, confidence: 85 },
  { time: "11am", performance: 55, confidence: 70 },
  { time: "12pm", performance: 85, confidence: 90 },
  { time: "1pm", performance: 95, confidence: 95 },
  { time: "2pm", performance: 88, confidence: 92 },
  { time: "3pm", performance: 92, confidence: 94 },
];

const chartConfig = {
  performance: { label: "Performance", color: "#8b5cf6" }, // Violet
  confidence: { label: "AI Confidence", color: "#10b981" }, // Emerald
} satisfies ChartConfig;

interface ActivityChartProps {
    data?: Array<{ time: string; performance: number; confidence: number }>;
}

export default function ActivityChart({ data }: ActivityChartProps) {
  const currentData = data || chartData;
  const currentAvg = currentData.length > 0 
    ? Math.round(currentData.reduce((acc, curr) => acc + curr.confidence, 0) / currentData.length)
    : 0;

  return (
    <Widget design="mumbai" className="gap-4 w-full h-full">
      <WidgetHeader>
        <div className="flex flex-col">
            <WidgetTitle className="text-sm font-medium text-slate-500 uppercase tracking-widest">Live AI Performance</WidgetTitle>
            <p className="text-2xl font-bold text-slate-900 mt-1">{currentAvg ? `${currentAvg}%` : 'N/A'}</p>
        </div>
      </WidgetHeader>
      <WidgetContent>
        <ChartContainer className="h-[200px] w-full" config={chartConfig}>
          <AreaChart data={currentData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
                dataKey="time" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8} 
                tick={{ fill: '#94a3b8', fontSize: 10 }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Area 
                type="monotone" 
                dataKey="performance" 
                stroke="#8b5cf6" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorPerf)" 
            />
            <Area 
                type="monotone" 
                dataKey="confidence" 
                stroke="#10b981" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorConf)" 
            />
          </AreaChart>
        </ChartContainer>
      </WidgetContent>
    </Widget>
  );
}
