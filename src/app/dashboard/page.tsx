"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";
import { LeadRow } from "@/lib/leads"; // Updated Import
import { useLeads } from "@/hooks/useLeads";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Phone, Clock, Loader2, Plus } from "lucide-react";

const CreateLeadModal = dynamic(() => import("@/components/CreateLeadModal"), {
  loading: () => null,
});

/**
 * Dashboard Page
 * Updated to support Single-Service Row Architecture
 */
export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { leads, isLoading, error } = useLeads();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Cast leads to LeadRow[] since the hook might still be generic or inferred differently
  const rows = (leads || []) as unknown as LeadRow[];

  /**
   * Memoized Stats & Calculations
   */
  const { stats, upcomingMeetings, recentLeads } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Calculate Today's Meetings
    const todayMeetings = rows.filter((l) => {
      const meetingDateStr = l.discussion_date;
      if (!meetingDateStr) return false;
      const mDate = new Date(meetingDateStr);
      mDate.setHours(0, 0, 0, 0);
      return mDate.getTime() === today.getTime();
    });

    // 2. Sort & Slice Upcoming Meetings
    const upcoming = rows
      .filter((l) => {
        const d = l.discussion_date;
        return d && new Date(d) >= today;
      })
      .sort((a, b) => {
        const da = new Date(a.discussion_date || 0).getTime();
        const db = new Date(b.discussion_date || 0).getTime();
        return da - db;
      })
      .slice(0, 8);

    // 3. Today's Follow-ups
    const followUpsDue = rows.filter((l) => {
      if (!l.follow_up_date) return false;
      const fDate = new Date(l.follow_up_date);
      fDate.setHours(0, 0, 0, 0);
      return fDate.getTime() === today.getTime();
    });

    return {
      stats: {
        total: rows.length,
        upcomingToday: todayMeetings.length,
        followUpsToday: followUpsDue.length,
      },
      upcomingMeetings: upcoming,
      recentLeads: [...rows].slice(0, 5), // Already sorted by created_at desc from API
    };
  }, [rows]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900 dark:text-gray-100" />
        <p className="text-muted-foreground animate-pulse">Analyzing dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-destructive/5 rounded-xl border border-destructive/10 text-destructive">
        Failed to load dashboard data. Please try refreshing.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">


      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Welcome back! Here's a snapshot of your current lead pipeline.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="rounded-xl px-6 py-6 h-auto font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
        >
          <Plus className="w-5 h-5 mr-2" /> Add New Entry
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Leads Card */}
        <Card
          className="group relative overflow-hidden bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-none rounded-[1.5rem] p-6 transition-all hover:translate-y-[-4px] cursor-pointer shadow-[0_15px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.25)]"
          onClick={() => router.push("/dashboard/leads")}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-white/10 dark:bg-zinc-900/10 flex items-center justify-center shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <Badge className="font-bold bg-white/20 dark:bg-zinc-900/20 text-white dark:text-zinc-900 border-none ring-1 ring-white/30 dark:ring-zinc-900/30">Active</Badge>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-white/50 dark:text-zinc-950/50 uppercase tracking-widest">Leads</p>
              <div className="text-3xl font-bold tracking-tight">{stats.total} Services</div>
            </div>
          </div>
        </Card>

        {/* Meetings Today Card */}
        <Card
          className="group relative overflow-hidden bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-none rounded-[1.5rem] p-6 transition-all hover:translate-y-[-4px] cursor-pointer shadow-[0_15px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.25)]"
          onClick={() => router.push("/dashboard/calendar")}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-white/10 dark:bg-zinc-900/10 flex items-center justify-center shadow-sm">
                <Calendar className="w-6 h-6" />
              </div>
              <Badge className="font-bold bg-white/20 dark:bg-zinc-900/20 text-white dark:text-zinc-900 border-none ring-1 ring-white/30 dark:ring-zinc-900/30">Today</Badge>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-white/50 dark:text-zinc-950/50 uppercase tracking-widest">Meetings Today</p>
              <div className="text-3xl font-bold tracking-tight">{stats.upcomingToday}</div>
            </div>
          </div>
        </Card>

        {/* Follow-ups Card */}
        <Card
          className="group relative overflow-hidden bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-none rounded-[1.5rem] p-6 transition-all hover:translate-y-[-4px] cursor-pointer shadow-[0_15px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.25)]"
          onClick={() => router.push("/dashboard/leads")}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-white/10 dark:bg-zinc-900/10 flex items-center justify-center shadow-sm">
                <Phone className="w-6 h-6" />
              </div>
              <Badge className="font-bold bg-white/20 dark:bg-zinc-900/20 text-white dark:text-zinc-900 border-none ring-1 ring-white/30 dark:ring-zinc-900/30">Action</Badge>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-white/50 dark:text-zinc-950/50 uppercase tracking-widest">Follow-ups Due</p>
              <div className="text-3xl font-bold tracking-tight">{stats.followUpsToday}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Activity Sections */}
      <div className="grid gap-10 lg:grid-cols-12">
        {/* Upcoming Meetings */}
        <Card className="lg:col-span-12 xl:col-span-8 bg-white dark:bg-zinc-900 border-none rounded-[1.5rem] overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_70px_rgba(0,0,0,0.15)] transition-all">
          <div className="p-6 bg-zinc-900 dark:bg-zinc-100 flex items-center justify-between">
            <h3 className="text-lg font-black flex items-center gap-3 text-white dark:text-zinc-900">
              <Clock className="w-5 h-5" /> Upcoming Meetings
            </h3>
            <Button variant="ghost" size="sm" className="text-[10px] font-bold text-white/60 dark:text-zinc-900/60 hover:text-white dark:hover:text-zinc-900 hover:bg-white/10 dark:hover:bg-zinc-900/10" onClick={() => router.push('/dashboard/calendar')}>View Full Calendar</Button>
          </div>
          <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
            {upcomingMeetings.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground/50 font-medium italic">No upcoming meetings scheduled.</div>
            ) : (
              upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.service_id}
                  className="flex items-center justify-between py-3.5 px-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all cursor-pointer group"
                  onClick={() => router.push(`/dashboard/leads/${meeting.lead_id}?serviceId=${meeting.service_id}`)}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-muted-foreground group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900 transition-all shadow-sm">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold tracking-tight group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">{meeting.client_name}</p>
                        <Badge variant="outline" className="font-bold text-[8px] uppercase tracking-wider px-1.5 py-0 h-4 border-border bg-secondary/20 leading-none">
                          {meeting.service_name}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-semibold text-muted-foreground/70 tracking-tight">{meeting.phone_number}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className="h-7 px-3 text-[10px] font-bold bg-zinc-50 dark:bg-transparent border-none text-muted-foreground group-hover:text-zinc-900 dark:group-hover:text-zinc-100 whitespace-nowrap flex-shrink-0">
                      {new Date(meeting.discussion_date || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-3 text-[9px] font-black uppercase tracking-tighter bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg transition-all shadow-sm flex items-center gap-1.5 group-hover:-translate-y-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push('/dashboard/calendar');
                      }}
                    >
                      <Calendar className="w-3 h-3" />
                      View Calendar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Leads */}
        <Card className="lg:col-span-12 xl:col-span-4 bg-white dark:bg-zinc-900 border-none rounded-[1.5rem] overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_70px_rgba(0,0,0,0.15)] transition-all">
          <div className="p-6 bg-zinc-900 dark:bg-zinc-100 flex items-center justify-between">
            <h3 className="text-lg font-black flex items-center gap-3 text-white dark:text-zinc-900">
              <Users className="w-5 h-5" /> Recent Entries
            </h3>
          </div>
          <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
            {recentLeads.map((lead) => (
              <div
                key={lead.service_id}
                className="flex items-center py-3 px-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all group cursor-pointer"
                onClick={() => router.push(`/dashboard/leads/${lead.lead_id}?serviceId=${lead.service_id}`)}
              >
                <div className="w-10 h-10 bg-zinc-900/5 dark:bg-zinc-100/10 rounded-lg flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-black text-lg mr-4 group-hover:scale-105 transition-transform shadow-sm">
                  {/* Safe Accessor: Ensure client_name exists before calling charAt */}
                  {(lead.client_name || "?").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-bold tracking-tight text-foreground truncate">{lead.client_name}</p>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">{lead.service_name}</Badge>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <Badge className="bg-white dark:bg-zinc-100 text-black hover:bg-zinc-100 dark:hover:bg-white border-none text-[10px] font-black px-3 py-1.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)] group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.2)] group-hover:-translate-y-0.5">
                    VIEW
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {showCreateModal && (
        <CreateLeadModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
          }}
        />
      )}
    </div>
  );
}
