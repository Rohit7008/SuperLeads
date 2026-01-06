"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";
import { Lead } from "@/lib/leads";
import { useLeads } from "@/hooks/useLeads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Phone, Clock, Loader2, Search, Bell, Plus, ChevronDown } from "lucide-react";

const CreateLeadModal = dynamic(() => import("@/components/CreateLeadModal"), {
  loading: () => null,
});

/**
 * Dashboard Page
 * 
 * Performance:
 * 1. React Query: Reuses the 'leads' query data if the user just navigated from the Leads list.
 * 2. useMemo: Aggregates stats and filters meetings/leads only when the data changes.
 * 
 * Flow: Navigating from 'Dashboard' to 'Leads' (and vice versa) will now be instant 
 * because they share the same cached 'leads' data.
 */
export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { leads, isLoading, error } = useLeads();
  const [showCreateModal, setShowCreateModal] = useState(false);

  /**
   * Memoized Stats & Calculations
   * We process the raw leads list to get dashboard-specific views.
   */
  const { stats, upcomingMeetings, recentLeads } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Calculate Today's Meetings
    const todayMeetings = leads.filter((l: Lead) => {
      const meetingDateStr = l.meeting_date || l.date;
      if (!meetingDateStr) return false;
      const mDate = new Date(meetingDateStr);
      mDate.setHours(0, 0, 0, 0);
      return mDate.getTime() === today.getTime();
    });

    // 2. Sort & Slice Upcoming Meetings
    const upcoming = leads
      .filter((l: Lead) => {
        const d = l.meeting_date || l.date;
        return d && new Date(d) >= today;
      })
      .sort((a: Lead, b: Lead) => {
        const da = new Date(a.meeting_date || a.date || 0).getTime();
        const db = new Date(b.meeting_date || b.date || 0).getTime();
        return da - db;
      })
      .slice(0, 8);

    // 3. Today's Follow-ups
    const followUpsDue = leads.filter((l: Lead) => {
      if (!l.follow_up_date) return false;
      const fDate = new Date(l.follow_up_date);
      fDate.setHours(0, 0, 0, 0);
      return fDate.getTime() === today.getTime();
    });

    return {
      stats: {
        total: leads.length,
        upcomingToday: todayMeetings.length,
        followUpsToday: followUpsDue.length,
      },
      upcomingMeetings: upcoming,
      recentLeads: [...leads].slice(-5).reverse(),
    };
  }, [leads]);

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
          <Plus className="w-5 h-5 mr-2" /> Add New Lead
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
              <Badge className="font-bold bg-white/20 dark:bg-zinc-900/20 text-white dark:text-zinc-900 border-none ring-1 ring-white/30 dark:ring-zinc-900/30">+12%</Badge>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-white/50 dark:text-zinc-950/50 uppercase tracking-widest">Total Leads</p>
              <div className="text-3xl font-bold tracking-tight">{stats.total}</div>
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
              upcomingMeetings.map((meeting: Lead) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between py-3.5 px-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all cursor-pointer group"
                  onClick={() => router.push(`/dashboard/leads/${meeting.id}`)}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-muted-foreground group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900 transition-all shadow-sm">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold tracking-tight group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">{meeting.name}</p>
                        {meeting.service.includes(",") ? (
                          <Badge className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-none text-[8px] font-black px-1.5 py-0 h-4 rounded-md uppercase tracking-tighter leading-none">
                            multiple services
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="font-bold text-[8px] uppercase tracking-wider px-1.5 py-0 h-4 border-border bg-secondary/20 leading-none">
                            {meeting.service}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-muted-foreground/70 tracking-tight">{meeting.phone_number}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className="h-7 px-3 text-[10px] font-bold bg-zinc-50 dark:bg-transparent border-none text-muted-foreground group-hover:text-zinc-900 dark:group-hover:text-zinc-100 whitespace-nowrap flex-shrink-0">
                      {new Date(meeting.meeting_date || meeting.date || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              <Users className="w-5 h-5" /> Recent Leads
            </h3>
          </div>
          <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
            {recentLeads.map((lead: Lead) => (
              <div
                key={lead.id}
                className="flex items-center py-3 px-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all group cursor-pointer"
                onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
              >
                <div className="w-10 h-10 bg-zinc-900/5 dark:bg-zinc-100/10 rounded-lg flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-black text-lg mr-4 group-hover:scale-105 transition-transform shadow-sm">
                  {lead.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-bold tracking-tight text-foreground truncate">{lead.name}</p>
                  <p className="text-[11px] font-semibold text-muted-foreground/70 tracking-tight">{lead.phone_number}</p>
                </div>
                <div className="flex flex-col items-end">
                  <Badge className="bg-white dark:bg-zinc-100 text-black hover:bg-zinc-100 dark:hover:bg-white border-none text-[10px] font-black px-3 py-1.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)] group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.2)] group-hover:-translate-y-0.5">
                    VIEW LEAD
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
