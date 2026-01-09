
"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLeads } from "@/hooks/useLeads";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    User as UserIcon, Mail, Users, CheckCircle2,
    ArrowRight, Calendar as CalendarIcon,
    Edit2, History, TrendingUp, Lock,
    Check, X, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LeadRow } from "@/lib/leads";
// import { User } from "@/lib/users"; // Unused

// --- Components ---

const ServiceBadge = ({ service }: { service: string }) => {
    if (!service) return null;
    const isMultiple = service.includes(",");
    if (isMultiple) {
        return (
            <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-none font-bold text-[8px] h-4 px-1.5 whitespace-nowrap">
                MULTIPLE SERVICES
            </Badge>
        );
    }
    return (
        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
            {service}
        </span>
    );
};

interface UserProfileProps {
    user: any;
    activities?: any[];
    leads?: any[]; // Allow passing leads directly
    isActivitiesLoading?: boolean;
    isEditable?: boolean;
}

export function UserProfile({
    user,
    activities = [],
    leads: propLeads, // Rename to avoid conflict if we use hook conditionally (or just use prop)
    isActivitiesLoading = false,
    isEditable = false
}: UserProfileProps) {
    const { updateProfile, updatePassword } = useAuth();

    // Use passed leads if available, otherwise fetch my leads
    // Note: Breaking rules of hooks if I call useLeads conditionally. 
    // Better to ALWAYS call useLeads but ignore it if propLeads is present?
    // Or just rely on parent to pass leads?
    // For backward compat with ProfilePage which might not pass leads yet:
    const { leads: hookLeads } = useLeads();
    const leads = propLeads || hookLeads;
    const [activeTab, setActiveTab] = useState("assignments");

    // Profile Editing State
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user?.user_metadata?.name || user.name || "");
    const [isUpdatingName, setIsUpdatingName] = useState(false);

    // Password Change State
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");

    const { myLeads, statistics } = useMemo(() => {
        if (!user) return { myLeads: [], statistics: { totalCreated: 0, converted: 0, upcomingMeetings: 0 } };

        // Filter leads created by THIS user (Use created_by as owner until reassignment logic exists)
        const filtered = leads.filter((l: LeadRow) => l.created_by === user.id);

        // "Closed by user"
        const converted = filtered.filter((l: LeadRow) => l.status === 'Closed').length;

        // "Upcoming Meetings": Count future events (Discussion OR Follow-up)
        // User requested: "normal scheduled and upcoming both"
        const now = new Date();
        const upcoming = filtered.filter((l: LeadRow) => {
            const discussionDate = l.discussion_date ? new Date(l.discussion_date) : null;
            const followUpDate = l.follow_up_date ? new Date(l.follow_up_date) : null;

            const hasFutureDiscussion = discussionDate && discussionDate > now;
            const hasFutureFollowUp = followUpDate && followUpDate > now;

            return hasFutureDiscussion || hasFutureFollowUp;
        }).length;

        return {
            myLeads: filtered,
            statistics: {
                totalCreated: filtered.length,
                converted: converted,
                upcomingMeetings: upcoming
            }
        };
    }, [leads, user]);

    const handleUpdateName = async () => {
        if (!isEditable) return;
        if (!newName.trim()) return;
        setIsUpdatingName(true);
        try {
            await updateProfile({ name: newName });
            setIsEditingName(false);
        } catch (error) {
            console.error("Failed to update name:", error);
        } finally {
            setIsUpdatingName(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!isEditable) return;
        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters");
            return;
        }

        setIsUpdatingPassword(true);
        setPasswordError("");
        try {
            await updatePassword(newPassword);
            setShowPasswordChange(false);
            setNewPassword("");
            setConfirmPassword("");
            alert("Password updated successfully!");
        } catch (error: any) {
            setPasswordError(error.message || "Failed to update password");
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-[1400px] mx-auto p-2 lg:p-6 lg:pt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="overflow-hidden border-none shadow-xl bg-white dark:bg-zinc-950 rounded-[2.5rem] p-8">
                        <div className="flex flex-col items-center text-center space-y-6">
                            {/* Avatar Section */}
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full bg-zinc-100 dark:bg-zinc-900 border-4 border-white dark:border-zinc-800 shadow-2xl flex items-center justify-center overflow-hidden">
                                    <UserIcon className="w-16 h-16 text-muted-foreground" />
                                </div>
                            </div>

                            <div className="space-y-2 w-full">
                                {isEditable && isEditingName ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="h-10 text-center font-bold text-xl"
                                            autoFocus
                                        />
                                        <button onClick={handleUpdateName} disabled={isUpdatingName} className="p-2 bg-emerald-500 text-white rounded-lg">
                                            {isUpdatingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => setIsEditingName(false)} className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <h2 className="text-2xl font-bold tracking-tight flex items-center justify-center gap-2 group">
                                        {user.user_metadata?.name || user.name || "Advisor"}
                                        {isEditable && (
                                            <button onClick={() => setIsEditingName(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md">
                                                <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                                            </button>
                                        )}
                                    </h2>
                                )}
                                {!isEditable && (
                                    <div className="flex justify-center">
                                        <Badge variant="outline" className="capitalize">
                                            {user.role || 'User'}
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <div className="w-full space-y-4 pt-4 text-left border-t border-zinc-100 dark:border-zinc-900">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Email Address</label>
                                    <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-900">
                                        <Mail className="w-4 h-4 text-zinc-900 dark:text-white opacity-70" />
                                        <span className="text-sm font-medium">{user.email}</span>
                                    </div>
                                </div>

                                {isEditable && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Security</label>
                                        <button
                                            onClick={() => setShowPasswordChange(!showPasswordChange)}
                                            className="w-full flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Lock className="w-4 h-4 text-zinc-900 dark:text-white opacity-70" />
                                                <span className="text-sm font-medium">Update Password</span>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-30" />
                                        </button>
                                    </div>
                                )}

                                {isEditable && showPasswordChange && (
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3 animate-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <Input
                                                type="password"
                                                placeholder="New Password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                            <Input
                                                type="password"
                                                placeholder="Confirm Password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                            {passwordError && <p className="text-[10px] text-red-500 font-bold">{passwordError}</p>}
                                            <Button
                                                onClick={handleUpdatePassword}
                                                disabled={isUpdatingPassword}
                                                className="w-full h-9 text-xs"
                                            >
                                                {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Password"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Stats and Content */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <Card className="p-6 border-none shadow-sm bg-white dark:bg-zinc-950 rounded-3xl flex flex-col justify-between group hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-4xl font-bold tracking-tight">{statistics.totalCreated}</span>
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">Leads Created</p>
                                <div className="flex items-center gap-1.5 mt-1 text-emerald-500">
                                    <TrendingUp className="w-3 h-3" />
                                    <span className="text-xs font-bold">+12.5%</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 border-none shadow-sm bg-white dark:bg-zinc-950 rounded-3xl flex flex-col justify-between group hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-4xl font-bold tracking-tight text-emerald-500">{statistics.converted}</span>
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">Closed</p>
                                <div className="flex items-center gap-1.5 mt-1 text-emerald-500">
                                    <TrendingUp className="w-3 h-3" />
                                    <span className="text-xs font-bold">+4.3%</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 border-none shadow-sm bg-zinc-900 text-white rounded-3xl flex flex-col justify-between group hover:shadow-md transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                            <div className="flex items-center justify-between">
                                <span className="text-4xl font-bold tracking-tight">{statistics.upcomingMeetings}</span>
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <CalendarIcon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <div className="mt-4 relative z-10">
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Upcoming Meetings</p>
                            </div>
                        </Card>
                    </div>

                    {/* Content Section with Tabs */}
                    <Card className="border-none shadow-sm bg-white dark:bg-zinc-950 rounded-3xl min-h-[500px] overflow-hidden">
                        <div className="border-b border-zinc-100 dark:border-zinc-900 px-8 py-6">
                            <div className="flex items-center gap-8">
                                <button
                                    onClick={() => setActiveTab("assignments")}
                                    className={cn(
                                        "pb-2 text-sm font-bold tracking-tight transition-all relative",
                                        activeTab === "assignments" ? "text-primary" : "text-muted-foreground opacity-50 hover:opacity-100"
                                    )}
                                >
                                    Assignments
                                    {activeTab === "assignments" && <div className="absolute bottom-[-24px] left-0 right-0 h-1 bg-zinc-900 dark:bg-white rounded-full" />}
                                </button>
                                <button
                                    onClick={() => setActiveTab("activity")}
                                    className={cn(
                                        "pb-2 text-sm font-bold tracking-tight transition-all relative",
                                        activeTab === "activity" ? "text-primary" : "text-muted-foreground opacity-50 hover:opacity-100"
                                    )}
                                >
                                    Activity Log
                                    {activeTab === "activity" && <div className="absolute bottom-[-24px] left-0 right-0 h-1 bg-zinc-900 dark:bg-white rounded-full" />}
                                </button>
                            </div>
                        </div>

                        <div className="p-8">
                            {activeTab === "assignments" ? (
                                <div className="space-y-4">
                                    {myLeads.length === 0 ? (
                                        <div className="py-20 text-center space-y-4">
                                            <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mx-auto">
                                                <History className="w-8 h-8 text-muted-foreground opacity-20" />
                                            </div>
                                            <p className="text-muted-foreground font-black uppercase tracking-widest text-sm opacity-30 italic">No Active Cases Found</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3">
                                            {myLeads.map((lead: LeadRow) => (
                                                <div key={lead.service_id} className="group flex items-center justify-between p-4 rounded-2xl border border-zinc-50 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all cursor-pointer">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-lg group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-zinc-900 transition-all">
                                                            {lead.client_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold tracking-tight">{lead.client_name}</h4>
                                                            <div className="flex items-center gap-3 mt-0.5">
                                                                <ServiceBadge service={lead.service_name} />
                                                                <Badge variant={
                                                                    lead.status === 'Closed' ? "success" :
                                                                        lead.status === 'Lost' ? "destructive" :
                                                                            lead.status === 'In Progress' ? "info" :
                                                                                "secondary"
                                                                } className="text-[8px] h-4 px-1.5 border-none">
                                                                    {lead.status === 'Closed' ? 'PAID' : lead.status.toUpperCase()}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right hidden sm:block">
                                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">Assigned Date</p>
                                                            <p className="text-xs font-bold">{new Date(lead.date || '').toLocaleDateString()}</p>
                                                        </div>
                                                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {isActivitiesLoading ? (
                                        <div className="flex items-center justify-center py-20">
                                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : activities.length === 0 ? (
                                        <div className="py-20 text-center space-y-4">
                                            <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mx-auto">
                                                <History className="w-8 h-8 text-muted-foreground opacity-20" />
                                            </div>
                                            <p className="text-muted-foreground font-black uppercase tracking-widest text-sm opacity-30 italic">No activities recorded</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {activities.map((activity) => (
                                                <div key={activity.id} className="relative pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] before:w-[2px] before:bg-zinc-100 dark:before:bg-zinc-900 last:before:hidden">
                                                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white dark:bg-zinc-950 border-2 border-zinc-900 dark:border-white flex items-center justify-center z-10">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                    </div>

                                                    {/* New Layout Implementation with Dull BG */}
                                                    <div className="space-y-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                                                        {/* 1. Header: Client Name - Service */}
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-black tracking-tight text-foreground">
                                                                    {activity.leads?.name || "Unknown Client"}
                                                                </span>
                                                                {activity.leads?.service && (
                                                                    <>
                                                                        <span className="text-zinc-300 dark:text-zinc-700">-</span>
                                                                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">
                                                                            {activity.leads.service}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            {/* 2. Phone Number */}
                                                            {activity.leads?.phone_number && (
                                                                <div className="text-xs font-mono font-medium text-muted-foreground/70">
                                                                    {activity.leads.phone_number}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* 3. Log Content & Date */}
                                                        <div className="flex items-end justify-between gap-4">
                                                            <div className="space-y-1">
                                                                {/* Creator Name (Tiny) */}
                                                                <div className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                                                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                                    {(activity as any).created_by_name || "System"}
                                                                </div>
                                                                <p className="text-sm font-medium leading-relaxed">
                                                                    {activity.content}
                                                                </p>
                                                            </div>

                                                            <span className="text-[10px] font-bold text-muted-foreground opacity-40 whitespace-nowrap mb-0.5">
                                                                {new Date(activity.created_at).toLocaleString('en-US', {
                                                                    month: 'numeric',
                                                                    day: 'numeric',
                                                                    year: 'numeric',
                                                                    hour: 'numeric',
                                                                    minute: '2-digit',
                                                                    hour12: true
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
}
