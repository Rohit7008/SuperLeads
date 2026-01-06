"use client";

import { useEffect, useState } from "react";
import { Lead } from "@/lib/leads";
import { getUsers, User } from "@/lib/users";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/card";
import { Calendar, Phone, User as UserIcon, Users, Clock, FileText, X, Trash2, CheckCircle2 } from "lucide-react";

export default function ViewLeadModal({
    lead,
    onClose,
    onEdit,
    onDelete,
}: {
    lead: Lead;
    onClose: () => void;
    onEdit: () => void;
    onDelete?: (id: number) => void;
}) {
    const [creatorName, setCreatorName] = useState<string>("Loading...");
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const usersData = await getUsers();
                setUsers(usersData);
                const creator = usersData.find(u => u.id === (lead.created_by as any));
                setCreatorName(creator ? creator.name : `Unknown (ID: ${lead.created_by})`);
            } catch (err) {
                console.error("Failed to load users", err);
                setCreatorName(`User ID: ${lead.created_by}`);
            }
        };
        loadData();
    }, [lead.created_by]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Not set";
        return new Date(dateString).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    const getAgentNames = () => {
        if (!lead.agent_ids || lead.agent_ids.length === 0) return "None";
        if (users.length === 0) return lead.agent_ids.join(", "); // Fallback if users not loaded

        return lead.agent_ids.map(id => {
            const agent = users.find(u => u.id === id);
            return agent ? agent.name : `ID: ${id}`;
        }).join(", ");
    };

    return (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-border rounded-3xl bg-white dark:bg-zinc-950 shadow-2xl">
                <div className="p-6 space-y-6">
                    <div className="px-10 py-8 border-b border-border flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">{lead.name}</h2>
                            <div className="flex items-center gap-3 mt-2">
                                <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-widest px-3">
                                    {lead.service}
                                </Badge>
                                {lead.is_converted && (
                                    <Badge className="font-bold text-[10px] uppercase tracking-widest px-3 bg-emerald-500 text-white border-none">
                                        Converted
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors h-10 w-10">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                        <div className="grid gap-10 md:grid-cols-2">
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-muted-foreground">
                                        <Phone className="w-4 h-4 opacity-60" /> Contact Number
                                    </label>
                                    <p className="text-xl font-bold tracking-tight pl-1">{lead.phone_number}</p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-muted-foreground/60">
                                        <Calendar className="w-4 h-4 opacity-60" /> Initial Consultation
                                    </label>
                                    <p className="text-xl font-bold tracking-tight pl-1">{formatDate(lead.date || lead.meeting_date)}</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-muted-foreground/60">
                                        <Clock className="w-4 h-4 opacity-60" /> Next Follow-up
                                    </label>
                                    <p className="text-xl font-bold tracking-tight pl-1">
                                        {lead.is_converted ? "CONVERTED" : formatDate(lead.follow_up_date)}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-muted-foreground/60">
                                        <Users className="w-4 h-4 opacity-60" /> Assigned Advisors
                                    </label>
                                    <p className="text-xl font-bold tracking-tight pl-1 min-h-[28px] flex items-center">
                                        {getAgentNames()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 mt-10">
                            <label className="text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-muted-foreground/60">
                                <FileText className="w-4 h-4 opacity-60" /> Account Overview
                            </label>
                            <div className="bg-zinc-50 dark:bg-zinc-900 border border-border/50 rounded-2xl p-8 text-lg font-medium tracking-tight whitespace-pre-wrap min-h-[140px]">
                                {lead.description || "No description provided."}
                            </div>
                        </div>

                        <div className="mt-10 flex items-center justify-between opacity-30">
                            <span className="h-px flex-1 bg-border" />
                            <p className="text-[9px] font-bold uppercase tracking-[0.3em] px-4">Client ID: {lead.id} / Advisor: {creatorName}</p>
                            <span className="h-px flex-1 bg-border" />
                        </div>
                    </div>
                </div>

                <div className="px-10 py-8 border-t border-border flex flex-col sm:flex-row justify-end gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <Button variant="ghost" onClick={onClose} className="h-12 px-6 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 order-3 sm:order-1 transition-all">
                        Close
                    </Button>
                    {onDelete && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (window.confirm("Are you sure?")) {
                                    onClose();
                                    onDelete(lead.id);
                                }
                            }}
                            className="h-12 px-6 rounded-xl font-bold border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/40 transition-all order-2 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> Delete Lead
                        </Button>
                    )}
                    <Button onClick={() => { onClose(); onEdit(); }} className="h-12 px-8 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all order-1 flex items-center gap-2">
                        Edit Details
                    </Button>
                </div>
            </Card>
        </div>
    );
}
