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
            className={cn("p-4", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-8 sm:space-y-0",
                month: "space-y-6",
                caption: "flex justify-center pt-2 relative items-center mb-4",
                caption_label: "text-sm font-bold tracking-tight uppercase",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-8 w-8 bg-transparent p-0 opacity-40 hover:opacity-100 transition-opacity duration-300 rounded-full"
                ),
                nav_button_previous: "absolute left-2",
                nav_button_next: "absolute right-2",
                table: "w-full border-collapse space-y-2",
                head_row: "flex mb-2",
                head_cell:
                    "text-muted-foreground/50 w-10 font-black text-[10px] uppercase tracking-widest text-center",
                row: "flex w-full mt-1.5",
                cell: "h-10 w-10 text-center text-xs p-0 relative transition-all duration-300 [&:has([aria-selected].day-range-end)]:rounded-r-2xl [&:has([aria-selected].day-outside)]:bg-accent/30 [&:has([aria-selected])]:bg-primary/5 first:[&:has([aria-selected])]:rounded-l-2xl last:[&:has([aria-selected])]:rounded-r-2xl focus-within:relative focus-within:z-20",
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-10 w-10 p-0 font-bold transition-all duration-300 rounded-2xl border border-transparent aria-selected:border-primary/20"
                ),
                day_range_end: "day-range-end",
                day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-lg shadow-primary/30",
                day_today: "bg-accent/50 text-accent-foreground font-black",
                day_outside:
                    "day-outside text-muted-foreground/20 opacity-30 aria-selected:bg-accent/30 aria-selected:text-muted-foreground aria-selected:opacity-20",
                day_disabled: "text-muted-foreground/10 opacity-20",
                day_range_middle:
                    "aria-selected:bg-primary/10 aria-selected:text-primary font-bold",
                day_hidden: "invisible",
                ...classNames,
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
