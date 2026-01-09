"use client";

import { useEffect, useState } from "react";
import { Lead, LeadRow, getClientDetails } from "@/lib/leads";
import { getUsers, User } from "@/lib/users";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/card";
import { Calendar, Phone, Users, Clock, FileText, X, Trash2 } from "lucide-react";

export default function ViewLeadModal({
    lead,
    onClose,
    onEdit,
    onDelete,
}: {
    lead: LeadRow;
    onClose: () => void;
    onEdit: () => void;
    onDelete?: (id: number) => void;
}) {
    const [fullLead, setFullLead] = useState<Lead | null>(null);
    const [creatorName, setCreatorName] = useState<string>("Loading...");
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [usersData, clientData] = await Promise.all([
                    getUsers(),
                    getClientDetails(lead.lead_id.toString())
                ]);
                setUsers(usersData);
                setFullLead(clientData);

                const creatorId = clientData.created_by;
                const creator = usersData.find(u => u.id === creatorId);
                setCreatorName(creator ? creator.name : (creatorId ? `Unknown` : 'System'));
            } catch (err) {
                console.error("Failed to load details", err);
                setCreatorName(`Unknown`);
            }
        };
        loadData();
    }, [lead.lead_id]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Not set";
        return new Date(dateString).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    const getAgentNames = () => {
        if (!fullLead || !fullLead.agent_ids || fullLead.agent_ids.length === 0) return "None";
        if (users.length === 0) return fullLead.agent_ids.join(", ");

        return fullLead.agent_ids.map((id: string) => {
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
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">{lead.client_name}</h2>
                            <div className="flex items-center gap-3 mt-2">
                                <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-widest px-3">
                                    {lead.service_name}
                                </Badge>
                                {(lead.status === 'Closed') && ( // Use status=Closed instead of is_converted
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
                                    <p className="text-xl font-bold tracking-tight pl-1">{formatDate(lead.discussion_date)}</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-muted-foreground/60">
                                        <Clock className="w-4 h-4 opacity-60" /> Next Follow-up
                                    </label>
                                    <p className="text-xl font-bold tracking-tight pl-1">
                                        {lead.status === 'Closed' ? "CONVERTED" : formatDate(lead.follow_up_date)}
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
                                {fullLead?.description || "No description provided."}
                            </div>
                        </div>

                        <div className="mt-10 flex items-center justify-between opacity-30">
                            <span className="h-px flex-1 bg-border" />
                            <p className="text-[9px] font-bold uppercase tracking-[0.3em] px-4">Client ID: {lead.lead_id} / Service ID: {lead.service_id}</p>
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
                                onClose();
                                onDelete(lead.lead_id); // Use lead_id
                            }
                            }
                            className="h-12 px-6 rounded-xl font-bold border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/40 transition-all order-2 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> Delete Lead
                        </Button>
                    )}
                    <Button onClick={() => { onClose(); onEdit(); }} className="h-12 px-8 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all order-1 flex items-center gap-2">
                        Edit Details
                    </Button>
                </div>
            </Card >
        </div >
    );
}
