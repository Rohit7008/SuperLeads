"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { LeadRow } from "@/lib/leads";
import { useLeads } from "@/hooks/useLeads";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { SERVICE_LIST } from "@/lib/constants";
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  ArrowUpDown,
  Calendar,
  Phone,
  Trash2,
  Pencil,
  ExternalLink,
  Check,
  PlusCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Table } from "@/components/ui/table";

// Lazy load modals
const CreateLeadModal = dynamic(() => import("@/components/CreateLeadModal"), { loading: () => null });
const EditLeadModal = dynamic(() => import("@/components/EditLeadModal"), { loading: () => null });
const AddServiceModal = dynamic(() => import("@/components/AddServiceModal"), { loading: () => null });

export default function LeadsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  // View Mode: 'all' | 'mine'
  // Default to 'all' as per user request to see all leads
  const [viewMode, setViewMode] = useState<'all' | 'mine'>('all');
  const { leads, isLoading, error, deleteLead } = useLeads({ all: viewMode === 'all' });

  // Memoize rows to stable reference
  const rows = useMemo(() => (leads || []) as unknown as LeadRow[], [leads]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadRow | null>(null);
  const [addingServiceLead, setAddingServiceLead] = useState<LeadRow | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    setTimeout(() => setNow(Date.now()), 0);
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    deleteLead(id);
  };

  const filteredRows = useMemo(() => {
    const term = searchTerm.toLowerCase();
    // Use the state 'now'
    const sortTime = now;

    // 1. Filter
    const filtered = rows.filter((row) => {
      // Search
      const matchesSearch =
        row.client_name.toLowerCase().includes(term) ||
        row.service_name.toLowerCase().includes(term) ||
        (row.phone_number && row.phone_number.includes(term));

      // Filter
      const matchesStatus = statusFilter === "all" || (statusFilter === 'active' ? row.status !== 'Closed' : row.status === statusFilter);
      const matchesService = selectedServices.length === 0 || selectedServices.includes(row.service_name);

      return matchesSearch && matchesStatus && matchesService;
    });

    // ... sort logic ...
    return filtered.sort((a, b) => { // Copied sort logic
      const getPriority = (r: LeadRow) => {
        if (!sortTime) return 4;
        if (r.discussion_date && new Date(r.discussion_date).getTime() < sortTime) return 1;
        if (r.status !== 'Closed' && r.follow_up_date && new Date(r.follow_up_date).getTime() < sortTime) return 2;
        if (r.discussion_date && new Date(r.discussion_date).getTime() >= sortTime) return 3;
        if (r.follow_up_date && new Date(r.follow_up_date).getTime() >= sortTime) return 5;
        return 6;
      };
      const pA = getPriority(a);
      const pB = getPriority(b);
      if (pA !== pB) return pA - pB;
      return b.service_id - a.service_id;
    });

  }, [rows, searchTerm, selectedServices, statusFilter, now]);

  // Error handling for Delete (using explicit any for error to satisfy linter if strictly typed elsewhere, but here we just ignore it or log it)



  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads & Pipelines</h1>
          <p className="text-muted-foreground text-sm">
            Manage your client services and track progress.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 border-dashed">
                <Filter className="w-4 h-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2 bg-white dark:bg-zinc-950 border border-border shadow-lg">
              <div className="space-y-2">
                <h4 className="font-bold text-[10px] text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-1.5 rounded-sm mb-1 uppercase tracking-wider">View</h4>
                <div className="space-y-1 mb-2">
                  <div
                    onClick={() => setViewMode('all')}
                    className={cn(
                      "flex items-center justify-between px-2 py-1.5 rounded-sm text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      viewMode === 'all' ? "font-bold text-primary" : "text-muted-foreground opacity-70"
                    )}
                  >
                    <span>All Leads</span>
                    {viewMode === 'all' && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div
                    onClick={() => setViewMode('mine')}
                    className={cn(
                      "flex items-center justify-between px-2 py-1.5 rounded-sm text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      viewMode === 'mine' ? "font-bold text-primary" : "text-muted-foreground opacity-70"
                    )}
                  >
                    <span>My Leads</span>
                    {viewMode === 'mine' && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
                <div className="h-px bg-border my-1" />
                <h4 className="font-bold text-[10px] text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-1.5 rounded-sm mb-1 uppercase tracking-wider">Status</h4>
                <div className="space-y-1">
                  {['all', 'New', 'In Progress', 'Closed'].map(s => (
                    <div key={s}
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        "flex items-center justify-between px-2 py-1.5 rounded-sm text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        statusFilter === s ? "font-bold text-primary" : "text-muted-foreground opacity-70"
                      )}
                    >
                      <span className="capitalize">{s}</span>
                      {statusFilter === s && <Check className="w-3.5 h-3.5" />}
                    </div>
                  ))}
                </div>
                <div className="h-px bg-border my-1" />
                <h4 className="font-bold text-[10px] text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-1.5 rounded-sm mb-1 uppercase tracking-wider">Services</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {SERVICE_LIST.map(s => (
                    <div key={s}
                      onClick={() => setSelectedServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                      className={cn(
                        "flex items-center justify-between px-2 py-1.5 rounded-sm text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        selectedServices.includes(s) ? "font-bold text-primary" : "text-muted-foreground opacity-70"
                      )}
                    >
                      <span className="truncate">{s}</span>
                      {selectedServices.includes(s) && <Check className="w-3.5 h-3.5" />}
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={() => setShowCreateModal(true)} className="h-10 font-bold shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Entry
          </Button>
        </div>
      </div>

      {/* Tables      {/* Data Table */} {/* WRAPPER ADDED */}
      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
        <div className="overflow-x-auto"> {/* Mobile Scroll Wrapper */}
          <Table>
            <thead className="bg-zinc-100 dark:bg-zinc-800 text-xs uppercase text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3 font-bold tracking-wider whitespace-nowrap">Client</th>
                <th className="px-4 py-3 font-bold tracking-wider whitespace-nowrap">Service Category</th>
                <th className="px-4 py-3 font-bold tracking-wider text-right whitespace-nowrap">Coverage</th>
                <th className="px-4 py-3 font-bold tracking-wider text-right whitespace-nowrap">Prem./Inv.</th>
                <th className="px-4 py-3 font-bold tracking-wider whitespace-nowrap">Status</th>
                <th className="px-4 py-3 font-bold tracking-wider whitespace-nowrap">Meeting Date</th>
                <th className="px-4 py-3 w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading records...</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No records found.</td></tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.service_id}
                    className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/leads/${row.lead_id}?serviceId=${row.service_id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-foreground">{row.client_name}</div>
                      <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {row.phone_number}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="font-semibold text-[10px] uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-foreground border-zinc-200 dark:border-zinc-700">
                        {row.service_name}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-muted-foreground">{row.coverage || "-"}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium">{row.premium_investment ? row.premium_investment.toLocaleString('en-IN') : "-"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={
                        row.status === 'Closed' ? "success" :
                          row.status === 'Lost' ? "destructive" :
                            row.status === 'In Progress' ? "info" :
                              "secondary"
                      } className="uppercase tracking-wider font-bold text-[10px]">
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {row.discussion_date && (
                          <div className={cn(
                            "text-[10px] font-medium flex items-center gap-1.5",
                            (now && new Date(row.discussion_date).getTime() < now) ? "text-zinc-400 dark:text-zinc-600 line-through" : "text-zinc-600 dark:text-zinc-400"
                          )}>
                            <Calendar className="w-3 h-3" /> {new Date(row.discussion_date).toLocaleDateString()}
                          </div>
                        )}
                        {row.follow_up_date && row.status !== 'Closed' && (
                          <div className={cn(
                            "text-[10px] font-bold flex items-center gap-1.5",
                            (now && new Date(row.follow_up_date).getTime() < now) ? "text-amber-600/50 dark:text-amber-500/50" : "text-amber-600 dark:text-amber-500"
                          )}>
                            <ArrowUpDown className="w-3 h-3" /> {new Date(row.follow_up_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">


                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px] bg-white dark:bg-zinc-950 border border-border shadow-lg z-50">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/leads/${row.lead_id}?serviceId=${row.service_id}`)}>
                              <ExternalLink className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingLead(row)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit Entry
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setAddingServiceLead(row)} className="text-primary font-bold cursor-pointer">
                              <PlusCircle className="mr-2 h-4 w-4" /> Add Service
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => handleDelete(row.service_id, e)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </div>

      {showCreateModal && (
        <CreateLeadModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["leads"] })}
        />
      )}

      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["leads"] })}
        />
      )}

      {/* Add Service Modal */}
      {addingServiceLead && (
        <AddServiceModal
          leadId={addingServiceLead.lead_id}
          clientName={addingServiceLead.client_name}
          onClose={() => setAddingServiceLead(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["leads"] })}
        />
      )}
    </div>
  );
}