"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { updateLead, Lead } from "@/lib/leads";
import { getUsers } from "@/lib/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/Badge";
import { DateTimePicker } from "./DateTimePicker";
import { cn } from "@/lib/utils";
import { User, Phone, Loader2, CheckSquare, Square } from "lucide-react";
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
  lead: Lead;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState({

    name: lead.name,
    phone_number: lead.phone_number ? (lead.phone_number.startsWith("+91") ? lead.phone_number : `+91${lead.phone_number}`) : "+91",

    services: lead.service ? lead.service.split(",").map((s: string) => s.trim()) : [],
    description: lead.description || "",
    meeting_date: lead.date || lead.meeting_date || "",
    follow_up_date: lead.follow_up_date || "",
    agent_ids: lead.agent_ids?.map(String) || [],
    is_converted: lead.is_converted || false,
  });

  const [error, setError] = useState<string | null>(null);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    staleTime: 1000 * 60 * 5,
  });

  const mutation = useMutation({
    mutationFn: (payload: any) => updateLead(lead.id, payload),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || "Failed to update lead. Please try again.");
    }
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      name: form.name,
      phone_number: form.phone_number,
      service: form.services.join(", "),
      description: form.description || undefined,
      meeting_date: form.meeting_date || undefined,
      follow_up_date: form.is_converted ? undefined : (form.follow_up_date || undefined),
      agent_ids: form.agent_ids,
      is_converted: form.is_converted,
      updated_by_name: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.name || user?.email || 'User',
    });
  };


  const toggleService = (service: string) => {
    setForm((prev: any) => {
      const services = prev.services.includes(service)
        ? prev.services.filter((s: string) => s !== service)
        : [...prev.services, service];
      return { ...prev, services };
    });
  };

  const toggleAgent = (userId: string) => {
    setForm((prev: any) => {
      const ids = prev.agent_ids.includes(userId)
        ? prev.agent_ids.filter((id: string) => id !== userId)
        : [...prev.agent_ids, userId];
      return { ...prev, agent_ids: ids };
    });
  };

  return (
    <Sheet open={true} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent side="right" className="sm:max-w-md w-full p-0 flex flex-col border-l border-border bg-white dark:bg-zinc-950">
        <SheetHeader className="px-6 pt-5 pb-2 border-b border-border bg-zinc-50/50 dark:bg-zinc-900/50 text-left">
          <SheetTitle className="text-lg font-bold tracking-tight text-foreground">Client Details</SheetTitle>
          <SheetDescription className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
            Updating {lead.name}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleUpdate} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 pt-3 space-y-5 custom-scrollbar">
            {error && (
              <div className="bg-destructive/5 text-destructive p-3 rounded-md text-xs font-semibold border border-destructive/10">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-1">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">
                  Client Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                  <Input
                    id="edit-name"
                    placeholder="Full Name"
                    className="pl-9 h-10 border-border bg-zinc-50 dark:bg-zinc-900/50 rounded-md text-sm font-medium focus:ring-1 focus:ring-primary/20 transition-all shadow-none"
                    value={form.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-phone" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">
                  Contact Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                  <Input
                    id="edit-phone"
                    placeholder="+91 00000 00000"
                    className="pl-9 h-10 border-border bg-zinc-50 dark:bg-zinc-900/50 rounded-md text-sm font-medium focus:ring-1 focus:ring-primary/20 transition-all shadow-none"
                    value={form.phone_number}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value;
                      if (!value.startsWith("+91")) {
                        setForm({ ...form, phone_number: "+91" });
                      } else {
                        setForm({ ...form, phone_number: value });
                      }
                    }}
                  />

                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">
                Services
              </Label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-md bg-zinc-50 dark:bg-zinc-900/50 border border-border/50">
                {Array.from(new Set([...SERVICE_LIST, ...form.services])).map((service: string) => (
                  <Badge
                    key={service}
                    variant={form.services.includes(service) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer text-[10px] font-bold px-2 py-0.5 rounded transition-all",
                      form.services.includes(service)
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    )}
                    onClick={() => toggleService(service)}
                  >
                    {service}
                  </Badge>
                ))}
              </div>
            </div>


            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-md border border-border/50 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Status
                </Label>
                <p className="text-[10px] font-medium text-muted-foreground opacity-60">Converted?</p>
              </div>
              <div
                className={cn(
                  "w-10 h-5 rounded-full border border-border flex items-center cursor-pointer transition-all p-0.5",
                  form.is_converted ? "bg-emerald-500 border-emerald-600" : "bg-zinc-200 dark:bg-zinc-800"
                )}
                onClick={() => setForm({ ...form, is_converted: !form.is_converted })}
              >
                <div className={cn(
                  "h-full aspect-square rounded-full transition-all flex items-center justify-center shadow-sm bg-white",
                  form.is_converted ? "translate-x-5" : "translate-x-0"
                )} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-desc" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">
                Client Overview
              </Label>
              <textarea
                id="edit-desc"
                placeholder="Description and context..."
                className="flex w-full rounded-md border border-border bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3 text-sm font-medium text-foreground focus:ring-1 focus:ring-primary/20 transition-all min-h-[80px] outline-none placeholder:text-muted-foreground/40 resize-none shadow-none"
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">
                  Scheduled Appointment
                </Label>
                <div className="overflow-hidden">
                  <DateTimePicker
                    value={form.meeting_date}
                    onChange={(date: string) => setForm({ ...form, meeting_date: date })}
                  />
                </div>
              </div>
              {!form.is_converted && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">
                    Follow-up Schedule
                  </Label>
                  <div className="overflow-hidden">
                    <DateTimePicker
                      value={form.follow_up_date}
                      onChange={(date: string) => setForm({ ...form, follow_up_date: date })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">
                Assigned Advisors ({form.agent_ids.length})
              </Label>
              <div className="grid grid-cols-1 gap-1 max-h-[140px] overflow-y-auto p-2 rounded-md bg-zinc-50 dark:bg-zinc-900/50 border border-border/50 custom-scrollbar">
                {usersLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-primary/40" />
                  </div>
                ) : (
                  users.map((user: any) => (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-md transition-all cursor-pointer border",
                        form.agent_ids.includes(user.id)
                          ? "bg-primary/5 text-primary border-primary/20"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800 border-transparent text-muted-foreground"
                      )}
                      onClick={() => toggleAgent(user.id)}
                    >
                      <span className="text-[11px] font-bold tracking-tight">{user.name}</span>
                      {form.agent_ids.includes(user.id) ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground/30" />
                      )}
                    </div>
                  ))
                )}
              </div>
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