"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Lead } from "@/lib/leads";
import { useLeads } from "@/hooks/useLeads";
import { Card } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, Clock, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy load modals and sidebar
const LeadSidebar = dynamic(() => import("@/components/LeadSidebar"), {
    loading: () => null,
});
const EditLeadModal = dynamic(() => import("@/components/EditLeadModal"), {
    loading: () => null,
});

/**
 * Calendar Page - Redesigned Layout
 * 
 * Layout: Two-column design
 * - Left (65%): Compact calendar grid
 * - Right (35%): Today's meetings sidebar
 * 
 * Performance:
 * 1. React Query: Shares cached lead data
 * 2. useMemo: Optimized filtering for today's meetings
 * 3. Dynamic imports: Lazy load modals
 */
export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewingLead, setViewingLead] = useState<Lead | null>(null);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);

    const { leads, isLoading, isFetching, refetch, deleteLead } = useLeads();

    const handleDeleteLead = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this lead?")) return;
        deleteLead(id);
        setViewingLead(null);
    };

    const handleEditFromSidebar = (lead: Lead) => {
        setViewingLead(null);
        setEditingLead(lead);
    };

    /**
     * Calendar Logic (Memoized)
     */
    const { days, groupedLeads, todayLeads } = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const intervalDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

        const today = startOfDay(new Date());
        const leadsWithDates = Array.isArray(leads) ? leads.filter(l => l.meeting_date || l.date) : [];

        // Filter today's meetings
        const todayMeetings = leadsWithDates.filter(lead => {
            const dateStr = lead.meeting_date || lead.date;
            if (!dateStr) return false;
            const leadDate = new Date(dateStr);
            return !isNaN(leadDate.getTime()) && isSameDay(leadDate, today);
        }).sort((a, b) => {
            const timeA = new Date(a.meeting_date || a.date || 0).getTime();
            const timeB = new Date(b.meeting_date || b.date || 0).getTime();
            return timeA - timeB;
        });

        return {
            days: intervalDays,
            groupedLeads: leadsWithDates,
            todayLeads: todayMeetings
        };
    }, [currentDate, leads]);

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-gray-900 dark:text-gray-100" />
                <p className="text-zinc-500 font-medium">Loading schedule...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Calendar Controls & View */}
            <div className="space-y-3">
                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 p-3 border-b-2 border-black dark:border-white">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentDate(new Date())}
                        className="font-bold uppercase tracking-widest text-[10px] rounded-xl border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all h-10 px-6"
                    >
                        Today
                    </Button>

                    <div className="flex items-center gap-8">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={prevMonth}
                            className="h-12 w-12 rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border-2 border-transparent hover:border-black dark:hover:border-white transition-all group"
                        >
                            <ChevronLeft className="h-6 w-6 group-hover:scale-110 transition-transform" />
                        </Button>

                        <h2 className="text-5xl font-black uppercase tracking-tighter italic min-w-[350px] text-center">
                            {format(currentDate, "MMMM yyyy")}
                        </h2>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={nextMonth}
                            className="h-12 w-12 rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border-2 border-transparent hover:border-black dark:hover:border-white transition-all group"
                        >
                            <ChevronRight className="h-6 w-6 group-hover:scale-110 transition-transform" />
                        </Button>
                    </div>

                    <div className="w-[100px]" /> {/* Spacer to keep month centered */}
                </div>

                {/* Full-Width Calendar Grid */}
                <Card className="bg-white dark:bg-zinc-950 border-2 border-black dark:border-white rounded-none overflow-hidden">
                    <div className="grid grid-cols-7 border-b-2 border-black dark:border-white bg-black text-white">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                            <div key={day} className="py-2.5 text-center text-[10px] font-black uppercase tracking-[0.2em]">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800">
                        {days.map((day, i) => {
                            const dayLeads = groupedLeads.filter(lead => {
                                const dateStr = lead.meeting_date || lead.date;
                                if (!dateStr) return false;
                                const leadDate = new Date(dateStr);
                                return !isNaN(leadDate.getTime()) && isSameDay(leadDate, day);
                            });

                            const colStartClasses = ['', 'col-start-2', 'col-start-3', 'col-start-4', 'col-start-5', 'col-start-6', 'col-start-7'];
                            const colStart = i === 0 ? colStartClasses[day.getDay()] : '';
                            const isToday = isSameDay(day, new Date());

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={cn(
                                        "min-h-[110px] p-2 bg-white dark:bg-zinc-950 transition-all relative group border-r border-b border-zinc-100 dark:border-zinc-800",
                                        colStart,
                                        isToday ? "bg-zinc-50 dark:bg-zinc-900" : ""
                                    )}
                                >
                                    <div className={cn(
                                        "w-7 h-7 rounded-none border-2 flex items-center justify-center text-[11px] font-black ml-auto mb-2 transition-all",
                                        isToday
                                            ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]"
                                            : "border-transparent text-zinc-400 group-hover:border-black dark:group-hover:border-white group-hover:text-black dark:group-hover:text-white"
                                    )}>
                                        {format(day, 'd')}
                                    </div>
                                    <div className="space-y-2">
                                        {dayLeads.map(lead => {
                                            const d = new Date(lead.meeting_date || lead.date || 0);
                                            const timeStr = isNaN(d.getTime()) ? "--:--" : format(d, "HH:mm");

                                            return (
                                                <div
                                                    key={lead.id}
                                                    suppressHydrationWarning
                                                    className="px-2 py-1.5 text-[10px] font-bold border-2 border-black dark:border-white bg-white dark:bg-zinc-900 rounded-none cursor-pointer hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all flex items-center justify-between gap-2 overflow-hidden"
                                                    onClick={() => setViewingLead(lead)}
                                                >
                                                    <span className="uppercase tracking-tighter truncate">
                                                        {lead.name.split(' ')[0]}
                                                    </span>
                                                    <span className="opacity-50 text-[9px] shrink-0 font-mono">
                                                        {timeStr}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

            {/* Sidebar instead of Modal */}
            {viewingLead && (
                <LeadSidebar
                    lead={viewingLead}
                    onClose={() => setViewingLead(null)}
                    onEdit={handleEditFromSidebar}
                />
            )}

            {editingLead && (
                <EditLeadModal
                    lead={editingLead}
                    onClose={() => setEditingLead(null)}
                    onSuccess={() => {
                        refetch();
                        setEditingLead(null);
                    }}
                />
            )}

            {/* Background Revalidation Indicator */}
            {isFetching && !isLoading && (
                <div className="fixed bottom-6 right-6 bg-primary text-primary-foreground px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom-6 duration-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating Schedule...
                </div>
            )}
        </div>
    );
}
