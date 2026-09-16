"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 select-none bg-card", className)}
      classNames={{
        root: "relative",
        months: "relative flex flex-col gap-3",
        month: "flex flex-col gap-3",
        nav: "flex items-center justify-between absolute top-0 inset-x-0 h-9 z-10 pointer-events-none px-1",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-background p-0 opacity-80 hover:opacity-100 pointer-events-auto rounded-full border border-border flex items-center justify-center cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95 text-foreground"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-background p-0 opacity-80 hover:opacity-100 pointer-events-auto rounded-full border border-border flex items-center justify-center cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95 text-foreground"
        ),
        month_caption: "flex justify-center items-center h-9 relative px-8",
        caption_label: "text-sm font-bold text-foreground tracking-tight font-display",
        month_grid: "w-full table-fixed border-collapse",
        weekdays: "border-b border-border/40",
        weekday:
          "w-9 h-8 text-center text-xs font-semibold text-muted-foreground p-0 align-middle uppercase tracking-wider",
        weeks: "space-y-1",
        week: "my-1",
        day: "w-9 h-9 p-0 text-center align-middle relative",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none cursor-pointer"
        ),
        range_end: "day-range-end",
        selected:
          "!bg-primary !text-primary-foreground font-bold shadow-xs hover:!bg-primary hover:!text-primary-foreground",
        today: "border border-primary text-primary font-bold rounded-lg",
        outside:
          "text-muted-foreground opacity-30 pointer-events-none",
        disabled: "text-muted-foreground opacity-20 pointer-events-none cursor-not-allowed",
        range_middle:
          "bg-accent text-accent-foreground rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: c, ...p }) => {
          if (orientation === "left") {
            return <ChevronLeft className={cn("h-4 w-4", c)} {...p} />
          }
          return <ChevronRight className={cn("h-4 w-4", c)} {...p} />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
