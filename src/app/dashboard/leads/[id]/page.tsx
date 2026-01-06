"use client";
// Forced re-build to detect new components

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLead, getLeadUpdates, addLeadUpdate, LeadUpdate } from "@/lib/leads";
import { getUsers } from "@/lib/users";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import {
    ArrowLeft,
    Phone,
    Calendar,
    Clock,
    User as UserIcon,
    Users,
    FileText,
    Send,
    Loader2,
    TrendingUp,
    History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";


const EditLeadModal = dynamic(() => import("@/components/EditLeadModal"), {
    loading: () => null,
});

export default function LeadDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [newNote, setNewNote] = useState("");
    const [showEditModal, setShowEditModal] = useState(false);


    // 1. Fetch Lead Details
    const { data: lead, isLoading: leadLoading, error: leadError } = useQuery({
        queryKey: ["lead", id],
        queryFn: () => getLead(id as string),
        enabled: !!id,
    });

    // 2. Fetch Lead Updates (Pipeline)
    const { data: updates = [], isLoading: updatesLoading } = useQuery({
        queryKey: ["lead-updates", id],
        queryFn: () => getLeadUpdates(id as string),
        enabled: !!id,
    });

    // 3. Fetch Users for context
    const { data: users = [] } = useQuery({
        queryKey: ["users"],
        queryFn: getUsers,
    });

    // 4. Mutation to add update
    const addUpdateMutation = useMutation({
        mutationFn: (content: string) => addLeadUpdate(
            id as string,
            content,
            'Note',
            user?.user_metadata?.full_name || user?.user_metadata?.name || user?.name || user?.email || 'User'
        ),
        onSuccess: () => {
            setNewNote("");
            queryClient.invalidateQueries({ queryKey: ["lead-updates", id] });
        }
    });


    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        addUpdateMutation.mutate(newNote);
    };

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

    if (leadLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-pulse">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-lg font-bold text-foreground">Loading Lead data...</p>
                    <p className="text-sm text-muted-foreground font-medium">Connecting to lead database.</p>
                </div>
            </div>
        );
    }

    if (leadError || !lead) {
        return (
            <div className="p-12 text-center max-w-2xl mx-auto space-y-6 mt-10">
                <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <UserIcon className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">Contact profile not found</h1>
                <p className="text-muted-foreground font-medium text-lg">
                    The lead profile you are looking for does not exist.
                </p>
                <div className="flex justify-center gap-4 pt-4">
                    <Button variant="outline" size="lg" onClick={() => router.back()} className="rounded-xl px-8 font-bold">
                        <ArrowLeft className="mr-2 w-5 h-5" /> Go Back
                    </Button>
                    <Button variant="default" size="lg" onClick={() => router.push('/dashboard')} className="rounded-xl px-8 font-bold shadow-lg shadow-primary/20">
                        Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-5">

            {/* Header Section */}
            <div className="flex justify-between items-start border-b border-border/60 pb-4 pt-2">

                <div className="space-y-2">
                    <div className="space-y-1">
                        <h1 className="text-6xl font-black tracking-tighter text-foreground uppercase">{lead.name}</h1>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-bold tracking-tight text-muted-foreground/40">
                        <span className="text-muted-foreground/20 font-light">|</span>
                        {lead.service ? lead.service.split(',').map((s: string, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-foreground/80">{s.trim().toUpperCase()}</span>
                                <span className="text-muted-foreground/20 font-light">|</span>
                            </div>
                        )) : <span className="text-foreground/80">NO SERVICES |</span>}
                    </div>

                    <p className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">
                        Lead created on: {formatDate(lead.created_at)}
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => setShowEditModal(true)}
                    className="h-10 px-6 rounded-xl font-bold border-border bg-white dark:bg-zinc-900 shadow-sm hover:bg-secondary/50 text-xs tracking-widest uppercase transition-all active:scale-95"
                >
                    Edit Lead Details
                </Button>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                {/* Left Column: Pipeline */}
                <div className="lg:col-span-8 space-y-3">
                    <div className="flex items-center justify-between pb-1">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <History className="w-5 h-5 text-primary/70" /> Conversion Timeline
                        </h3>
                        <Badge variant="outline" className="h-6 px-3 rounded-full text-[10px] font-bold bg-secondary/30">
                            {updates.length} Updates
                        </Badge>
                    </div>

                    {/* Quick Entry */}
                    <Card className="rounded-2xl border border-border shadow-sm overflow-hidden">
                        <form onSubmit={handleAddNote} className="relative">
                            <textarea
                                className="w-full h-16 bg-transparent p-3 text-sm font-medium outline-none focus:ring-0 placeholder:text-muted-foreground/40 resize-none"
                                placeholder="Update account activity or notes..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                disabled={addUpdateMutation.isPending}
                            />

                            <div className="bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 border-t border-border flex justify-between items-center">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic opacity-50">Post Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <Button
                                    type="submit"
                                    disabled={addUpdateMutation.isPending || !newNote.trim()}
                                    className="h-7 px-3 rounded-lg text-[9px] font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    {addUpdateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Send className="w-3 h-3 mr-1.5" /> Post Update</>}
                                </Button>
                            </div>

                        </form>
                    </Card>

                    {/* Timeline Sequence */}
                    <div className="relative pt-4">
                        {/* Vertical Line - High Contrast */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-300 dark:bg-zinc-700 z-0" />

                        {updatesLoading ? (
                            <div className="space-y-4 pl-12">
                                {[1, 2].map(i => <div key={i} className="h-24 w-full bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-2xl" />)}
                            </div>
                        ) : updates.length === 0 ? (
                            <div className="text-center py-10 bg-secondary/10 rounded-2xl border border-dashed border-border flex flex-col items-center ml-12">
                                <History className="w-8 h-8 text-muted-foreground/30 mb-2" />
                                <p className="text-xs font-bold text-muted-foreground/50 tracking-tight italic">No updates recorded yet.</p>
                            </div>

                        ) : (
                            <div className="space-y-6">
                                {updates.map((update: LeadUpdate) => (
                                    <div key={update.id} className="relative pl-12 transition-all hover:translate-x-0.5 group">
                                        {/* Dot & Horizontal Connector */}
                                        <div className="absolute left-0 top-3 flex items-center justify-center w-8 h-8 z-10">
                                            <div className="w-4 h-4 rounded-full bg-primary ring-[5px] ring-white dark:ring-zinc-950 shadow-xl shadow-primary/30" />
                                            {/* Horizontal Line - High Contrast */}
                                            <div className="absolute left-4 w-8 h-[2px] bg-zinc-300 dark:bg-zinc-700" />
                                        </div>

                                        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-border shadow-sm transition-all group-hover:shadow-md">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <time className="text-[10px] font-bold text-muted-foreground/80 tracking-tight">
                                                        {formatDate(update.created_at)}
                                                    </time>
                                                </div>
                                                <div className="flex items-center gap-1 text-muted-foreground/40">
                                                    <UserIcon className="w-2.5 h-2.5" />
                                                    <span className="text-[9px] font-bold">
                                                        {update.profiles?.name || users.find(u => u.id === update.created_by)?.name || update.created_by_name || 'System'}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm font-semibold leading-relaxed text-foreground/90">
                                                {update.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* Right Column: Intel Cards */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="bg-white dark:bg-zinc-900 border-none rounded-[1.5rem] overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_70px_rgba(0,0,0,0.15)] transition-all">
                        <div className="p-6 bg-zinc-900 dark:bg-zinc-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-white dark:text-zinc-900 uppercase tracking-widest">
                                <UserIcon className="w-3.5 h-3.5" />
                                <span>Client identity</span>
                            </div>
                        </div>

                        <div className="p-4 space-y-6 pt-3">
                            {/* Section: Client Details */}
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start text-xs text-muted-foreground">
                                        <span className="font-medium">Phone number</span>
                                        <span className="font-black text-foreground font-mono">
                                            {lead.phone_number.includes('+91')
                                                ? `+91 ${lead.phone_number.replace(/\D/g, '').slice(-10)}`
                                                : `+91 ${lead.phone_number}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-start text-xs text-muted-foreground">
                                        <span className="font-medium">Insurance</span>
                                        <Badge variant="outline" className={cn(
                                            "font-black text-[10px] px-2 py-0 h-5 border-none",
                                            lead.is_converted ? "bg-green-500/10 text-green-600" : "bg-zinc-100 dark:bg-zinc-800 text-foreground"
                                        )}>
                                            {lead.is_converted ? 'CONVERTED' : 'PENDING'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Appointment */}
                            <div className="space-y-4 pt-4 border-t border-border/50">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Schedule & Timeline</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start text-xs text-muted-foreground">
                                        <span className="font-medium">Appointment</span>
                                        <span className="font-black text-foreground font-mono text-right">{formatDate(lead.date || lead.meeting_date)}</span>
                                    </div>
                                    {!lead.is_converted && (
                                        <div className="flex justify-between items-start text-xs text-muted-foreground">
                                            <span className="font-medium">Follow-up</span>
                                            <span className="font-black text-foreground font-mono text-right">{formatDate(lead.follow_up_date)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section: Advisors */}
                            <div className="space-y-4 pt-4 border-t border-border/50">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>Assigned advisors</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {lead.agent_ids?.length ? lead.agent_ids.map(id => {
                                        const user = users.find(u => u.id === id);
                                        return (
                                            <Badge key={id} variant="secondary" className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-foreground border-border/50">
                                                {user?.name || `ID-${id}`}
                                            </Badge>
                                        );
                                    }) : (
                                        <p className="text-[11px] font-medium text-muted-foreground italic">No advisors assigned.</p>
                                    )}
                                </div>
                            </div>

                            {/* Section: Overview */}
                            <div className="space-y-4 pt-4 border-t border-border/50">
                                <div className="p-3 bg-zinc-900 dark:bg-zinc-100 rounded-xl mb-4">
                                    <div className="flex items-center justify-between text-xs font-bold text-white dark:text-zinc-900 uppercase tracking-widest">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>Case Overview</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-border/50 border-dashed">
                                    <p className="text-xs font-medium leading-relaxed text-muted-foreground/80 italic">
                                        "{lead.description || "No account notes provided for this record."}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

            </div>

            {showEditModal && (
                <EditLeadModal
                    lead={lead}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ["lead", id] });
                        queryClient.invalidateQueries({ queryKey: ["leads"] });
                    }}
                />
            )}
        </div>
    );
}

function Label({ className, children, ...props }: any) {
    return (
        <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props}>
            {children}
        </label>
    );
}
