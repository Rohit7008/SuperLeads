
"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserProfile } from "@/components/profile/UserProfile";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const { id: userId } = use(params);

    // Fetch user details
    const { data: user, isLoading: isUserLoading, error } = useQuery({
        queryKey: ["user", userId],
        queryFn: async () => {
            const res = await api.get(`/users/${userId}`);
            return res.data;
        },
        enabled: !!userId,
    });

    const { data: leads, isLoading: isLeadsLoading } = useQuery({
        queryKey: ["leads", userId],
        queryFn: async () => {
            const res = await api.get(`/leads?userId=${userId}`);
            return res.data;
        },
        enabled: !!userId,
    });

    const { data: activities, isLoading: isActivitiesLoading } = useQuery({
        queryKey: ["activities", userId],
        queryFn: async () => {
            const res = await api.get(`/activities?userId=${userId}`);
            return res.data;
        },
        enabled: !!userId,
    });

    if (loading || isUserLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500">Failed to load user profile.</p>
                <button onClick={() => router.back()} className="mt-4 text-sm underline">Go Back</button>
            </div>
        );
    }

    return (
        <UserProfile
            user={user}
            activities={activities || []}
            leads={leads || []}
            isActivitiesLoading={isActivitiesLoading}
            isEditable={false}
        />
    );
}
