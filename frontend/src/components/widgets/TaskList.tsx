"use client";

import React from "react";
import { CheckCircle2Icon, CircleIcon, BrainCircuit, MessageSquare, PhoneCall } from "lucide-react";
import { Widget, WidgetContent, WidgetHeader, WidgetTitle } from "@/components/ui/widget";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface Task {
    id: string;
    title: string;
    status: string;
    priority: 'high' | 'medium';
}

interface TaskListProps {
    data?: Task[];
}

export default function TaskList({ data }: TaskListProps) {
  // Use prop data or empty array if not provided (no fake data)
  const taskList = data && data.length > 0 ? data : [
     { id: '1', title: 'No pending tasks', status: 'completed', priority: 'medium' }
  ];

  return (
    <Widget className="gap-2 w-full h-full" design="mumbai">
      <WidgetHeader className="justify-start pb-2">
         <WidgetTitle className="text-sm font-medium text-slate-500 uppercase tracking-widest">Action Items</WidgetTitle>
      </WidgetHeader>
      <WidgetContent className="flex-col gap-2">
        {taskList.map((todo) => (
          <button className="w-full text-left" key={todo.id}>
            <div className="hover:bg-slate-50 group flex w-full items-center justify-start gap-3 rounded-lg px-2 py-2 text-sm transition-all">
              {todo.status === 'completed' || todo.status === 'resolved' ? (
                  <CheckCircle2Icon className="text-emerald-500 size-5 flex-shrink-0" />
              ) : todo.priority === 'high' ? (
                  <CircleIcon className="text-rose-500 size-5 flex-shrink-0" />
              ) : (
                  <CircleIcon className="text-slate-300 size-5 flex-shrink-0" />
              )}
              <div className="flex flex-col">
                  <Label className={cn(
                      "cursor-pointer font-medium transition-all", 
                      todo.status === 'completed' ? "text-slate-400 line-through" : "text-slate-700"
                  )}>
                      {todo.title}
                  </Label>
                  <span className={cn(
                      "text-[10px] uppercase tracking-wider font-bold",
                      todo.priority === 'high' ? "text-rose-500" : "text-slate-400"
                  )}>
                      {todo.status}
                  </span>
              </div>
            </div>
          </button>
        ))}
      </WidgetContent>
    </Widget>
  );
}
