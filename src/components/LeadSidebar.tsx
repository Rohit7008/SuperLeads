"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LeadRow, getLeadUpdates, LeadUpdate } from "@/lib/leads"; // Updated Import
import { getUsers, User } from "@/lib/users";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/card";
import {
    Calendar,
    User as UserIcon,
    X,
    History,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadSidebarProps {
    lead: LeadRow;
    onClose: () => void;
    onEdit: (lead: LeadRow) => void;
}

export default function LeadSidebar({ lead, onClose, onEdit }: LeadSidebarProps) {
    const router = useRouter();
    const [updates, setUpdates] = useState<LeadUpdate[]>([]);
    const [loadingUpdates, setLoadingUpdates] = useState(true);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const loadData = async () => {
            setLoadingUpdates(true);
            try {
                // Fetch updates for the CLIENT (lead_id)
                const [updatesData, usersData] = await Promise.all([
                    getLeadUpdates(lead.lead_id.toString()),
                    getUsers() // Still fetching users for agent names if needed in logs
                ]);
                setUpdates(updatesData);
                setUsers(usersData);
            } catch (err) {
                console.error("Failed to load sidebar data", err);
            } finally {
                setLoadingUpdates(false);
            }
        };
        loadData();
    }, [lead.lead_id]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "NOT SET";
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? "INVALID" : d.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).toUpperCase();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 w-screen h-screen bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-white dark:bg-zinc-950 border-l border-border shadow-2xl z-[101] animate-in slide-in-from-right duration-500 ease-out flex flex-col">
                {/* Header */}
                <div className="p-8 pb-6 border-b border-border/60 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">{lead.client_name}</h2>
                            <div className="flex items-center gap-2 text-sm text-primary font-bold">
                                {lead.service_name}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="rounded-full h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors -mt-2"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-bold tracking-tight text-muted-foreground/40">
                        <span className="text-foreground/80">{lead.service_name.toUpperCase()} PIPELINE</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    {/* Intel Card: Client Profile */}
                    <Card className="bg-white dark:bg-zinc-900 border-none rounded-[1.5rem] overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_70px_rgba(0,0,0,0.15)] transition-all">
                        <div className="p-6 bg-zinc-900 dark:bg-zinc-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-white dark:text-zinc-900 uppercase tracking-widest">
                                <UserIcon className="w-3.5 h-3.5" />
                                <span>Service Details</span>
                            </div>
                        </div>

                        <div className="p-4 space-y-6 pt-3">
                            {/* Section: Client Details */}
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start text-xs text-muted-foreground">
                                        <span className="font-medium">Phone number</span>
                                        <span className="font-black text-foreground font-mono">
                                            {lead.phone_number?.includes('+91')
                                                ? `+91 ${lead.phone_number.replace(/\D/g, '').slice(-10)}`
                                                : `+91 ${lead.phone_number}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-start text-xs text-muted-foreground">
                                        <span className="font-medium">Status</span>
                                        <Badge variant="outline" className={cn(
                                            "font-black text-[10px] px-2 py-0 h-5 border-none",
                                            lead.status === 'Closed' ? "bg-green-500/10 text-green-600" : "bg-zinc-100 dark:bg-zinc-800 text-foreground"
                                        )}>
                                            {lead.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-start text-xs text-muted-foreground">
                                        <span className="font-medium">Coverage</span>
                                        <span className="font-black text-foreground">{lead.coverage || "N/A"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Appointment */}
                            <div className="space-y-4 pt-4 border-t border-border/50">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Schedule</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start text-xs text-muted-foreground">
                                        <span className="font-medium">Discussion</span>
                                        <span className="font-black text-foreground font-mono text-right">{formatDate(lead.discussion_date)}</span>
                                    </div>
                                    {lead.status !== 'Closed' && lead.follow_up_date && (
                                        <div className="flex justify-between items-start text-xs text-muted-foreground">
                                            <span className="font-medium">Follow-up</span>
                                            <span className="font-black text-foreground font-mono text-right">{formatDate(lead.follow_up_date)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Recent Logs Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between pb-1">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <History className="w-5 h-5 text-primary/70" /> Recent Activity
                            </h3>
                            <Badge variant="outline" className="h-6 px-3 rounded-full text-[10px] font-bold bg-secondary/30">
                                {updates.length} Updates
                            </Badge>
                        </div>

                        <div className="relative pt-4">
                            {/* Vertical Line */}
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-300 dark:bg-zinc-700 z-0" />

                            {loadingUpdates ? (
                                <div className="space-y-4 pl-12">
                                    {[1, 2].map(i => <div key={i} className="h-20 w-full bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-2xl" />)}
                                </div>
                            ) : updates.length === 0 ? (
                                <div className="text-center py-8 bg-secondary/10 rounded-2xl border border-dashed border-border flex flex-col items-center ml-12">
                                    <p className="text-xs font-bold text-muted-foreground/50 tracking-tight italic">No updates recorded.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {updates.slice(0, 10).map((update: LeadUpdate) => (
                                        <div key={update.id} className="relative pl-12 transition-all hover:translate-x-0.5 group">
                                            {/* Dot & Horizontal Connector */}
                                            <div className="absolute left-0 top-3 flex items-center justify-center w-8 h-8 z-10">
                                                <div className="w-4 h-4 rounded-full bg-primary ring-[5px] ring-white dark:ring-zinc-900 shadow-xl shadow-primary/30" />
                                                <div className="absolute left-4 w-8 h-[2px] bg-zinc-300 dark:bg-zinc-700" />
                                            </div>

                                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-border shadow-sm transition-all group-hover:shadow-md">
                                                <div className="flex items-center justify-between mb-2">
                                                    <time className="text-[10px] font-bold text-muted-foreground/80 tracking-tight">
                                                        {formatDate(update.created_at)}
                                                    </time>
                                                    <div className="flex items-center gap-1 text-muted-foreground/40">
                                                        <UserIcon className="w-2.5 h-2.5" />
                                                        <span className="text-[9px] font-bold">
                                                            {update.profiles?.name || users.find(u => u.id === update.created_by)?.name || update.created_by_name || 'System'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-xs font-semibold leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                                    {update.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-border bg-white dark:bg-zinc-950 flex items-center justify-between">
                    <button
                        onClick={() => onEdit(lead)}
                        className="text-sm font-black uppercase tracking-widest hover:underline transition-all text-primary"
                    >
                        Edit Service
                    </button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            onClose();
                            router.push(`/dashboard/leads/${lead.lead_id}?serviceId=${lead.service_id}`);
                        }}
                        className="h-12 px-8 rounded-xl font-bold border-border bg-white dark:bg-zinc-900 text-xs uppercase tracking-widest hover:bg-secondary/50 transition-all shadow-sm active:scale-95 text-primary"
                    >
                        View Full Details
                    </Button>
                </div>
            </div>
        </>
    );
}
