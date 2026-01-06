"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-6 bg-white dark:bg-black rounded-none border-4 border-black dark:border-white shadow-none", className)}
            classNames={{
                months: "flex flex-col sm:flex-row gap-y-4 sm:gap-x-4",
                month: "space-y-4",
                month_caption: "flex justify-center pt-2 relative items-center mb-6",
                caption_label: "text-xl font-black uppercase tracking-tighter italic",
                nav: "flex items-center absolute right-4 top-4 space-x-2 z-10",
                button_previous: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-10 w-10 bg-white dark:bg-zinc-950 p-0 border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-10 w-10 bg-white dark:bg-zinc-950 p-0 border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                ),
                month_grid: "w-full border-collapse space-y-1",
                weekdays: "flex mb-2",
                weekday: "text-black dark:text-white w-10 font-black uppercase text-[10px] tracking-widest text-center",
                week: "flex w-full mt-2",
                day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-10 w-10 p-0 font-black text-sm uppercase tracking-tighter border-2 border-transparent hover:border-black dark:hover:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all rounded-none"
                ),
                range_start: "day-range-start",
                range_end: "day-range-end",
                selected:
                    "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white dark:bg-white dark:text-black dark:hover:bg-white dark:hover:text-black dark:focus:bg-white dark:focus:text-black border-2 border-black dark:border-white z-10",
                today: "ring-2 ring-black dark:ring-white ring-offset-2 bg-transparent text-black dark:text-white font-black italic underline",
                outside:
                    "day-outside text-black/20 dark:text-white/20 opacity-30",
                disabled: "text-black/10 dark:text-white/10 opacity-20",
                range_middle:
                    "aria-selected:bg-black/10 dark:aria-selected:bg-white/10",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) => {
                    if (orientation === "left") return <ChevronLeft className="h-4 w-4" />;
                    return <ChevronRight className="h-4 w-4" />;
                },
            }}
            {...props}
        />
    );
}
Calendar.displayName = "Calendar";

export { Calendar };
