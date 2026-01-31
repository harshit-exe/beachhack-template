import * as React from "react"
import { cn } from "@/lib/utils"

const Widget = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { design?: string }>(({ className, design, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border bg-white text-slate-950 shadow-sm", className)} {...props} />
))
Widget.displayName = "Widget"

const WidgetHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-row items-center justify-between space-y-0 p-6", className)} {...props} />
))
WidgetHeader.displayName = "WidgetHeader"

const WidgetTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
))
WidgetTitle.displayName = "WidgetTitle"

const WidgetContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
WidgetContent.displayName = "WidgetContent"

const WidgetFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
))
WidgetFooter.displayName = "WidgetFooter"

export { Widget, WidgetHeader, WidgetFooter, WidgetTitle, WidgetContent }
