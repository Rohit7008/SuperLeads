"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Lead } from "@/lib/leads";
import { useLeads } from "@/hooks/useLeads";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SERVICE_LIST } from "@/lib/constants";

// Lazy load modals for better performance
const CreateLeadModal = dynamic(() => import("@/components/CreateLeadModal"), {
  loading: () => null,
});
const EditLeadModal = dynamic(() => import("@/components/EditLeadModal"), {
  loading: () => null,
});
const ViewLeadModal = dynamic(() => import("@/components/ViewLeadModal"), {
  loading: () => null,
});
import {
  Phone,
  Calendar,
  Pencil,
  Plus,
  Trash2,
  Search,
  Filter,
  Users,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check } from "lucide-react";

/**
 * Leads Management Page
 * 
 * Performance Optimizations:
 * 1. React Query: Handles all data fetching, caching, and background revalidation.
 * 2. useMemo: Filters the leads list locally to avoid expensive recalculations on every render.
 * 3. Optimistic Updates: (Planned) Could be added for even faster UI feel.
 * 4. Stale-While-Revalidate: Users see cached data immediately while new data loads in background.
 */
export default function LeadsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { leads, isLoading, isFetching, error, refetch, deleteLead } = useLeads();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [meetingTimeline, setMeetingTimeline] = useState<string>("all");

  const handleDeleteLead = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    deleteLead(id);
  };

  /**
   * Filtered Leads (Memoized)
   * Only recalculates when 'leads' or 'searchTerm' changes.
   * This keeps the search input feeling snappy.
   */
  const filteredLeads = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return leads.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(term) ||
        lead.service.toLowerCase().includes(term) ||
        lead.phone_number.includes(term);

      const matchesService = selectedServices.length === 0 || selectedServices.includes(lead.service);

      let matchesTimeline = true;
      if (meetingTimeline !== "all") {
        const meetingDate = lead.meeting_date || lead.date ? new Date(lead.meeting_date || lead.date || "") : null;
        if (!meetingDate || isNaN(meetingDate.getTime())) {
          matchesTimeline = false;
        } else {
          if (meetingTimeline === "next-week") {
            matchesTimeline = meetingDate >= now && meetingDate <= nextWeek;
          } else if (meetingTimeline === "next-month") {
            matchesTimeline = meetingDate >= now && meetingDate <= nextMonth;
          }
        }
      }

      return matchesSearch && matchesService && matchesTimeline;
    });
  }, [leads, searchTerm, selectedServices, meetingTimeline]);



  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 pt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Leads Management</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Manage and track your client acquisition pipeline.
          </p>
        </div>

        <div className="flex flex-1 md:flex-none items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search leads by name, service..."
              className="pl-11 pr-12 h-11 bg-white dark:bg-zinc-900 border-border rounded-xl font-medium focus:ring-2 focus:ring-primary/10 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg transition-colors",
                    (selectedServices.length > 0 || meetingTimeline !== "all")
                      ? "text-primary bg-primary/10 hover:bg-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Advanced Filters"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[340px] p-0 rounded-2xl border border-border/50 shadow-2xl bg-white dark:bg-zinc-950 z-[100]" align="end" sideOffset={8}>
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm tracking-tight text-foreground">Advanced Filters</h4>
                    {(selectedServices.length > 0 || meetingTimeline !== "all") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary hover:bg-primary/5"
                        onClick={() => {
                          setSelectedServices([]);
                          setMeetingTimeline("all");
                        }}
                      >
                        Reset All
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">By Services</label>
                        {selectedServices.length > 0 && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                            {selectedServices.length} Selected
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {SERVICE_LIST.map(service => (
                          <button
                            key={service}
                            onClick={() => {
                              setSelectedServices(prev =>
                                prev.includes(service)
                                  ? prev.filter(s => s !== service)
                                  : [...prev, service]
                              );
                            }}
                            className={cn(
                              "text-left px-3 py-2 rounded-xl text-[11px] font-bold transition-all border shrink-0 truncate flex items-center justify-between min-h-[40px]",
                              selectedServices.includes(service)
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                : "bg-secondary/30 text-muted-foreground border-border hover:border-primary/50"
                            )}
                          >
                            <span className="truncate">{service}</span>
                            {selectedServices.includes(service) && <Check className="w-3 h-3 ml-1 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Meeting Timeline</label>
                      <div className="flex flex-col gap-2">
                        {[
                          { id: "all", label: "Any Time" },
                          { id: "next-week", label: "Next 7 Days" },
                          { id: "next-month", label: "Next 30 Days" }
                        ].map(timeline => (
                          <button
                            key={timeline.id}
                            onClick={() => setMeetingTimeline(timeline.id)}
                            className={cn(
                              "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all border",
                              meetingTimeline === timeline.id
                                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-black"
                                : "bg-zinc-50 dark:bg-zinc-900 text-muted-foreground border-border hover:border-zinc-500"
                            )}
                          >
                            {timeline.label}
                            {meetingTimeline === timeline.id && <Check className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            size="lg"
            className="h-11 px-6 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20 shrink-0"
          >
            <Plus className="w-5 h-5 mr-2" /> Add New Lead
          </Button>
        </div>
      </div>

      <hr className="border-border/50" />


      {/* Content Area */}
      <div className="grid gap-6">
        {error && (
          <div className="bg-destructive/5 text-destructive p-4 rounded-xl text-sm font-semibold border border-destructive/10">
            System Alert: Failed to sync lead data. Please check your connection.
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 w-full bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-24 rounded-3xl border-2 border-dashed border-border flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6 text-muted-foreground">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-xl mb-2">No Leads Found</h3>
            <p className="text-muted-foreground max-w-xs mx-auto text-sm">Please add at least one lead entry to generate insights and metrics.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                className="group relative bg-white dark:bg-zinc-950 border border-border rounded-xl p-3 transition-all hover:shadow-lg hover:shadow-black/5 flex flex-col md:flex-row items-center justify-between gap-3 overflow-hidden cursor-pointer"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex-1 min-w-0 flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-border flex items-center justify-center text-muted-foreground shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-inner">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-base tracking-tight text-foreground truncate group-hover:text-primary transition-colors">{lead.name}</h3>
                      <div className="flex flex-wrap gap-1">
                        {lead.service.includes(',') ? (
                          <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-none text-[8px] font-black px-1.5 py-0 h-3.5 rounded-md uppercase tracking-tighter">
                            multiple services
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="font-bold text-[8px] uppercase tracking-wider px-1.5 py-0 h-3.5 border-border bg-secondary/20">
                            {lead.service}
                          </Badge>
                        )}
                      </div>
                      {lead.is_converted && (
                        <Badge className="font-bold text-[8px] uppercase tracking-wider px-1.5 py-0 h-3.5 bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm">
                          Converted
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground font-medium">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-primary opacity-60" />
                        <span className="font-mono">{lead.phone_number}</span>
                      </div>
                      {(lead.date || lead.meeting_date) && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-primary opacity-60" />
                          <span>
                            {(() => {
                              const d = new Date(lead.date || lead.meeting_date || "");
                              return isNaN(d.getTime()) ? "No Date Set" : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                            })()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 w-full md:w-auto shrink-0 relative z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg border border-border/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingLead(lead);
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg border border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLead(lead.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
        }
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateLeadModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            console.log("[LeadsPage] New lead created, refreshing...");
            queryClient.invalidateQueries({ queryKey: ["leads"] });
          }}
        />
      )}

      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

    </div>
  );
}