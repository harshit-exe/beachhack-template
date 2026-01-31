"use client"

import {
  Widget,
  WidgetHeader,
  WidgetContent,
  WidgetTitle,
} from "@/components/ui/widget";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";

const visitorsChartData = [
  { percentage: "40", color: "bg-blue-500" },
  { percentage: "23", color: "bg-yellow-500" },
  { percentage: "20", color: "bg-rose-500" },
  { percentage: "17", color: "bg-emerald-500" },
];

const visitorsByDeviceChartData = [
  { device: "MacOS", count: 1578, color: "bg-blue-500" },
  { device: "iOS", count: 908, color: "bg-yellow-500" },
  { device: "Windows", count: 789, color: "bg-rose-500" },
  { device: "Android", count: 671, color: "bg-emerald-500" },
];

interface VisitorsChartProps {
    data?: Array<{ platform: string; visitors: number; percentage: number; color: string }>;
}

export default function VisitorsChart({ data }: VisitorsChartProps) {
  // Fallback data
  const channels = data || [
      { platform: "Phone", visitors: 0, percentage: 0, color: "bg-indigo-500" },
      { platform: "WhatsApp", visitors: 0, percentage: 0, color: "bg-emerald-500" },
  ];

  const total = channels.reduce((acc, curr) => acc + curr.visitors, 0);

  return (
    <Widget className="gap-4 w-full h-full" design="mumbai">
      <WidgetHeader>
         <div className="flex flex-col">
            <WidgetTitle className="text-sm font-medium text-slate-500 uppercase tracking-widest">Channel Activity</WidgetTitle>
            <p className="text-2xl font-bold text-slate-900 mt-1">{total.toLocaleString()}</p>
         </div>
      </WidgetHeader>
      <WidgetContent className="flex flex-col justify-start gap-6">
        <TooltipProvider>
        <div className="flex h-4 w-full rounded-full overflow-hidden bg-slate-100">
          {channels.map((el, i) => (
            el.percentage > 0 && (
            <Tooltip key={i} delayDuration={300}>
              <TooltipTrigger asChild>
                <div
                  style={{ width: `${el.percentage}%` }}
                  className={cn(
                    el.color,
                    "h-full transition-all duration-300 hover:opacity-80 hover:cursor-pointer",
                  )}
                />
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 text-white border-0">
                {el.platform}: {el.percentage}%
              </TooltipContent>
            </Tooltip>
            )
          ))}
        </div>
        </TooltipProvider>
        <div className="w-full space-y-3">
          {channels.map((el) => (
            <div
              key={el.platform}
              className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3"
            >
              <div className={cn("size-2.5 rounded-full", el.color)} />
              <Label className="font-normal text-slate-600">{el.platform}</Label>
              <Label className="font-bold text-slate-900">{el.visitors}</Label>
            </div>
          ))}
        </div>
      </WidgetContent>
    </Widget>
  );
}
