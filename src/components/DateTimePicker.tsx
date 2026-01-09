"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function DateTimePicker({
    value,
    onChange,
}: {
    value?: string | Date;
    onChange: (date: Date) => void;
}) {
    const [open, setOpen] = React.useState(false);

    // Parse initial value
    const initialDate = React.useMemo(() => {
        if (!value) return undefined;
        const d = new Date(value);
        return isNaN(d.getTime()) ? undefined : d;
    }, [value]);

    const [date, setDate] = React.useState<Date | undefined>(initialDate);
    const [time, setTime] = React.useState<string>(
        initialDate ? format(initialDate, "HH:mm") : "09:00"
    );

    // Sync state if value prop changes externally
    React.useEffect(() => {
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
        setOpen(false);
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
        const [hours, minutes] = selectedTime.split(":").map(Number);
        const newDate = new Date(selectedDate);
        newDate.setHours(hours);
        newDate.setMinutes(minutes);
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
        onChange(newDate);
    };

    return (
        <div className="flex gap-4">
            <div className="flex flex-col gap-3 flex-1">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            id="date-picker"
                            className="w-full justify-between font-normal h-10"
                        >
                            {date ? date.toLocaleDateString() : "Select date"}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex flex-col gap-3 w-32">
                <Input
                    type="time"
                    id="time-picker"
                    value={time}
                    onChange={handleTimeChange}
                    className="bg-background appearance-none h-10 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
            </div>
        </div>
    );
}
