"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClientDetails, getServiceDetails, getLeadUpdates, addLeadUpdate, LeadUpdate, LeadRow } from "@/lib/leads";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";
import {
    Phone,
    Calendar,
    ArrowLeft,
    Shield,
    IndianRupee,
    Activity,
    AlertCircle,
    UserCircle2,
    Pencil
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const EditLeadModal = dynamic(() => import("@/components/EditLeadModal"), {
    loading: () => null,
});

export default function LeadDetailsPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Handle params safely
    const id = params?.id as string;
    const serviceId = searchParams.get("serviceId");

    const [newUpdate, setNewUpdate] = useState("");
    const [editingLead, setEditingLead] = useState<LeadRow | null>(null);

    // 1. Fetch Client Details (Includes all services in lead_services)
    const { data: client, isLoading: clientLoading } = useQuery({
        queryKey: ["client", id],
        queryFn: () => getClientDetails(id),
        enabled: !!id,
    });

    // 2. Fetch Specific Service Details (if serviceId exists)
    const { data: service, isLoading: serviceLoading } = useQuery({
        queryKey: ["service", serviceId],
        queryFn: () => serviceId ? getServiceDetails(serviceId) : null,
        enabled: !!serviceId,
    });

    // 3. Fetch Updates (Timeline) - NOW FILTERED BY SERVICE ID
    const { data: updates, isLoading: updatesLoading } = useQuery({
        // Include serviceId in queryKey to trigger refetch when switching services
        queryKey: ["lead-updates", id, serviceId],
        // Pass serviceId to fetcher
        queryFn: () => getLeadUpdates(id, serviceId || undefined),
        enabled: !!id,
    });

    const updateMutation = useMutation({
        // Pass serviceId (as number) to API
        mutationFn: (content: string) => addLeadUpdate(
            id,
            content,
            'Note',
            user?.user_metadata?.full_name || user?.email,
            service ? service.id : undefined // <--- The Fix: Link note to this service
        ),
        onSuccess: () => {
            setNewUpdate("");
            queryClient.invalidateQueries({ queryKey: ["lead-updates", id] });
        },
    });

    const handleAddUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUpdate.trim()) return;

        // Simple submission. No hacks. API handles the rest.
        updateMutation.mutate(newUpdate);
    };

    const isLoading = clientLoading || (serviceId && serviceLoading);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-4"></div>
                    <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-xl font-bold mb-2">Client Not Found</h2>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

            {/* Header / Navigation */}
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/leads')} className="rounded-full h-8 w-8 p-0 hover:bg-zinc-200 dark:hover:bg-zinc-800">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-xl font-bold tracking-tight opacity-50">Back to Leads</h1>
            </div>

            {service ? (
                <div className="space-y-6">

                    {/* 1. Client Identity Section (Flat) */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div className="space-y-2">
                            <h2 className="text-5xl font-black tracking-tighter text-foreground leading-none">{client.name}</h2>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-lg font-mono font-bold text-muted-foreground">
                                    <Phone className="w-4 h-4" />
                                    <span>{client.phone_number}</span>
                                </div>
                                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                <div className="text-lg font-bold text-primary">{service.service_name}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Badge variant={
                                service.status === 'Closed' ? "success" :
                                    service.status === 'Lost' ? "destructive" :
                                        service.status === 'In Progress' ? "info" :
                                            "secondary"
                            } className="self-start text-sm font-bold px-4 py-1.5 uppercase tracking-wider rounded-full">
                                {service.status}
                            </Badge>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    if (client && service) {
                                        setEditingLead({
                                            // Construct LeadRow from Client + Service for editing
                                            service_id: service.id,
                                            lead_id: client.id,
                                            client_name: client.name,
                                            phone_number: client.phone_number,
                                            email: client.email,
                                            service_name: service.service_name,
                                            status: service.status,
                                            coverage: service.coverage,
                                            premium_investment: service.premium_investment,
                                            discussion_date: service.discussion_date,
                                            follow_up_date: service.follow_up_date,
                                            meeting_date: undefined,
                                            agent_ids: client.agent_ids,
                                            date: service.created_at,
                                            created_by: service.created_by
                                        } as LeadRow);
                                    }
                                }}
                                className="h-8 w-8 rounded-full border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>

                    {/* 2. Service/Deal Metrics Section (Grid) */}
                    <div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-1 p-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Shield className="w-3 h-3" /> Coverage
                                </div>
                                <div className="text-3xl font-black tracking-tighter">{service.coverage || "N/A"}</div>
                            </div>
                            <div className="space-y-1 p-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <IndianRupee className="w-3 h-3" /> Premium
                                </div>
                                <div className="text-3xl font-black tracking-tighter font-mono text-primary">
                                    {service.premium_investment ? service.premium_investment.toLocaleString('en-IN') : "N/A"}
                                </div>
                            </div>
                            <div className="space-y-1 p-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" /> Discussion
                                </div>
                                <div className="text-2xl font-bold tracking-tight">
                                    {service.discussion_date ? new Date(service.discussion_date).toLocaleDateString() : "-"}
                                </div>
                            </div>
                            <div className="space-y-1 p-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Activity className="w-3 h-3" /> Follow Up
                                </div>
                                <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-500">
                                    {service.follow_up_date ? new Date(service.follow_up_date).toLocaleDateString() : "-"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-[1px] w-full bg-zinc-200 dark:bg-zinc-800" />

                    {/* 3. Activity Timeline Section */}
                    <div className="space-y-4 max-w-3xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                                Activity Timeline
                            </h3>
                        </div>

                        <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-2 rounded-2xl border shadow-sm ring-4 ring-zinc-50 dark:ring-zinc-950">
                            <div className="w-8 h-8 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center flex-shrink-0">
                                <UserCircle2 className="w-5 h-5" />
                            </div>
                            <form onSubmit={handleAddUpdate} className="flex-1 relative">
                                <Input
                                    value={newUpdate}
                                    onChange={(e) => setNewUpdate(e.target.value)}
                                    placeholder="Add a note..."
                                    className="border-0 bg-transparent focus-visible:ring-0 px-2 h-10 text-base font-medium"
                                    autoFocus
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={updateMutation.isPending || !newUpdate.trim()}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 h-8 px-4 rounded-lg font-bold"
                                >
                                    {updateMutation.isPending ? "..." : "Post"}
                                </Button>
                            </form>
                        </div>

                        <div className="relative pl-6 space-y-8">
                            {/* Timeline Vertical Line */}
                            <div className="absolute left-[11px] top-2 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-800" />

                            {updatesLoading ? (
                                <div className="pl-8 text-muted-foreground">Loading...</div>
                            ) : updates?.length === 0 ? (
                                <div className="pl-8 text-muted-foreground italic">No activity for this service yet.</div>
                            ) : (
                                updates?.map((update) => (
                                    <div key={update.id} className="relative pl-8 group">
                                        {/* Dot */}
                                        <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-900 border-4 border-white dark:border-black flex items-center justify-center z-10 shadow-sm">
                                            <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600 group-hover:bg-primary transition-colors" />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-sm font-bold text-foreground">
                                                    {update.created_by_name || "System"}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <div className="text-base text-foreground/90 leading-relaxed font-medium">
                                                {update.content}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <AlertCircle className="w-12 h-12 mb-4" />
                    <p className="font-bold">No Service Pipeline Selected</p>
                </div>
            )}

            {/* Modal - Rendered Conditionally */}
            {editingLead && (
                <EditLeadModal
                    lead={editingLead}
                    onClose={() => setEditingLead(null)}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ["service", serviceId] });
                        queryClient.invalidateQueries({ queryKey: ["lead-updates", id] });
                        setEditingLead(null);
                    }}
                />
            )}
        </div>
    );
}
