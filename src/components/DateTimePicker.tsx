"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DateTimePicker({
    value,
    onChange,
    placeholder = "Pick a date",
}: {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const [date, setDate] = useState<Date | undefined>(() => {
        if (!value) return undefined;
        const d = new Date(value);
        return isNaN(d.getTime()) ? undefined : d;
    });

    const [time, setTime] = useState<string>(() => {
        if (!value) return "09:00";
        const d = new Date(value);
        return isNaN(d.getTime()) ? "09:00" : format(d, "HH:mm");
    });

    useEffect(() => {
        if (value) {
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
                setDate(d);
                setTime(format(d, "HH:mm"));
            }
        }
    }, [value]);

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) return;
        setDate(selectedDate);
        updateDateTime(selectedDate, time);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value;
        setTime(newTime);
        if (date) {
            updateDateTime(date, newTime);
        }
    };

    const updateDateTime = (selectedDate: Date, selectedTime: string) => {
        const d = new Date(selectedDate);
        if (isNaN(d.getTime())) return;

        const [hours, minutes] = selectedTime.split(":").map(Number);
        d.setHours(hours || 0);
        d.setMinutes(minutes || 0);

        if (!isNaN(d.getTime())) {
            onChange(d.toISOString());
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left text-sm h-12 px-5 border border-border bg-zinc-50 dark:bg-zinc-900/50 rounded-xl font-semibold transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        !date && "text-muted-foreground/60"
                    )}
                >
                    <CalendarIcon className="mr-3 h-4 w-4 text-primary opacity-60" />
                    {date ? format(date, "PPP p") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border border-border shadow-2xl rounded-3xl overflow-hidden z-[100] bg-white dark:bg-zinc-950" align="start" sideOffset={8}>
                <div className="flex flex-col sm:flex-row">
                    <div className="p-4">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            initialFocus
                            className="border-0 shadow-none"
                        />
                    </div>
                    <div className="p-8 sm:border-l border-border bg-zinc-50/50 dark:bg-zinc-900/50 min-w-[220px] flex flex-col justify-center">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <Label htmlFor="time-picker" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Operational</Label>
                                    <span className="text-xs font-bold leading-none">Time Slot</span>
                                </div>
                            </div>
                            <Input
                                id="time-picker"
                                type="time"
                                value={time}
                                onChange={handleTimeChange}
                                className="h-12 text-lg bg-white dark:bg-zinc-900 border border-border rounded-xl font-bold focus:ring-2 focus:ring-primary/10 transition-all text-center"
                            />
                            <div className="flex items-center justify-center gap-2">
                                <span className="h-px flex-1 bg-border/60" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">
                                    24H Format
                                </p>
                                <span className="h-px flex-1 bg-border/60" />
                            </div>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
