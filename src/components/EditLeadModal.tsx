import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { updateLeadService, addLeadUpdate, LeadRow } from "@/lib/leads";
import { getUsers, User as AppUser } from "@/lib/users";

import { Button, Input, Label } from "@/components/ui";

import { DateTimePicker } from "./DateTimePicker";
import { cn } from "@/lib/utils";
import { User, IndianRupee, Loader2, MessageSquare } from "lucide-react";
import { SERVICE_LIST } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export default function EditLeadModal({
  lead,
  onClose,
  onSuccess,
}: {
  lead: LeadRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();

  // Fetch Users for Assignment
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  // Initialize form with LeadRow data
  const [form, setForm] = useState({
    name: lead.client_name,
    phone_number: lead.phone_number,
    service_name: lead.service_name,
    coverage: lead.coverage || "",
    premium_investment: lead.premium_investment?.toString() || "",
    status: lead.status || "New",
    discussion_date: lead.discussion_date || "",
    follow_up_date: lead.follow_up_date || "",
    description: "",
    created_by: lead.created_by || user?.id, // Default to current owner or current user
    logEntry: "", // New field for Activity Log
  });

  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: { service_name: string; coverage?: string; premium_investment?: number; status: string; discussion_date?: string; follow_up_date?: string; created_by?: string }) => {
      // 1. Update Service
      await updateLeadService(lead.service_id, payload);

      // 2. Add Log Entry if present
      if (form.logEntry.trim()) {
        await addLeadUpdate(
          lead.lead_id.toString(),
          form.logEntry,
          'Note',
          user?.name || 'Unknown',
          lead.service_id
        );
      }
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      setError(err.response?.data?.detail || "Failed to update entry. Please try again.");
    }
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      service_name: form.service_name,
      coverage: form.coverage || undefined,
      premium_investment: form.premium_investment ? parseFloat(form.premium_investment) : undefined,
      status: form.status,
      discussion_date: form.discussion_date || undefined,
      follow_up_date: form.status === 'Closed' ? undefined : (form.follow_up_date || undefined),
      created_by: form.created_by,
    });
  };

  return (
    <Sheet open={true} onOpenChange={(open: boolean) => !open && onClose()}>
      {/* ... keeping existing Sheet structure until Service Category ... */}
      <SheetContent side="right" className="sm:max-w-md w-full p-0 flex flex-col border-l border-border bg-white dark:bg-zinc-950">
        <SheetHeader className="px-6 pt-5 border-b border-border bg-zinc-50/50 dark:bg-zinc-900/50 text-left">
          <SheetTitle className="text-lg font-bold tracking-tight text-foreground">Edit Service Entry</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleUpdate} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 pt-3 space-y-5 custom-scrollbar">
            {/* ... Error & Client Details blocks remain same ... */}
            {error && (
              <div className="bg-destructive/5 text-destructive p-3 rounded-md text-xs font-semibold border border-destructive/10">
                {error}
              </div>
            )}

            <div className="space-y-3 p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-md border border-border/50 opacity-80">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Client Identity (Read Only)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">Name</Label>
                  <div className="text-sm font-semibold pl-0.5">{form.name}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">Phone</Label>
                  <div className="text-sm font-mono font-medium pl-0.5">{form.phone_number}</div>
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="space-y-4">


              <div className="flex items-center gap-2 mb-1 pb-2 border-b border-dashed border-border/60">                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Service Details</span>
              </div>

              {/* Assigned To - NEW FIELD */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">
                  Assigned To
                </Label>
                <select
                  className="flex h-10 w-full rounded-md border border-border bg-zinc-50 dark:bg-zinc-900/50 px-3 py-1 text-sm font-medium shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.created_by}
                  onChange={e => setForm({ ...form, created_by: e.target.value })}
                >
                  {users?.map((u: AppUser) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">
                  Service Category
                </Label>
                <select
                  className="flex h-10 w-full rounded-md border border-border bg-zinc-50 dark:bg-zinc-900/50 px-3 py-1 text-sm font-medium shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.service_name}
                  onChange={e => setForm({ ...form, service_name: e.target.value as any })}
                >
                  {SERVICE_LIST.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">Coverage</Label>
                  <Input
                    className="h-10 border-border bg-zinc-50 dark:bg-zinc-900/50 font-medium shadow-none focus-visible:ring-0"
                    placeholder="e.g. 1 Cr, 5L"
                    value={form.coverage}
                    onChange={e => setForm({ ...form, coverage: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">Premium / Inv.</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                    <Input
                      className="h-10 pl-9 border-border bg-zinc-50 dark:bg-zinc-900/50 font-mono font-medium shadow-none focus-visible:ring-0"
                      placeholder="Amount"
                      type="number"
                      value={form.premium_investment}
                      onChange={e => setForm({ ...form, premium_investment: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-border bg-zinc-50 dark:bg-zinc-900/50 px-3 py-1 text-sm font-medium shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                >
                  <option value="New">New</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              {/* Log Entry */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Add Log to Pipeline
                  </Label>
                </div>
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-border bg-zinc-50 dark:bg-zinc-900/50 font-medium shadow-none focus-visible:ring-0 resize-none p-2"
                  placeholder="Enter note or updates..."
                  value={form.logEntry}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, logEntry: e.target.value })}
                />
              </div>


            </div>




            <div className="grid grid-cols-1 gap-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">
                  Scheduled Appointment
                </Label>
                <div className="overflow-hidden">
                  <DateTimePicker
                    value={form.discussion_date}
                    onChange={(date: Date) => setForm({ ...form, discussion_date: date.toISOString() })}
                  />
                </div>
              </div>
              {form.status !== 'Closed' && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">
                    Follow-up Schedule
                  </Label>
                  <div className="overflow-hidden">
                    <DateTimePicker
                      value={form.follow_up_date}
                      onChange={(date: Date) => setForm({ ...form, follow_up_date: date.toISOString() })}
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="px-6 py-4 border-t border-border bg-zinc-50/50 dark:bg-zinc-900/50 flex gap-2.5">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1 rounded-md text-sm font-bold h-12 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30 border-0 tracking-widest uppercase"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-2 rounded-md h-12 text-sm font-bold shadow-lg shadow-primary/10 tracking-widest uppercase"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}