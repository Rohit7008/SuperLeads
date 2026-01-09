"use client";

import { useAuth } from "@/context/AuthContext";
import { useActivities } from "@/hooks/useActivities";
import { UserProfile } from "@/components/profile/UserProfile";

export default function ProfilePage() {
    const { user } = useAuth();
    const { activities, isLoading: isActivitiesLoading } = useActivities();

    if (!user) return null;

    return (
        <UserProfile
            user={user}
            activities={activities}
            isActivitiesLoading={isActivitiesLoading}
            isEditable={true}
        />
    );
}
