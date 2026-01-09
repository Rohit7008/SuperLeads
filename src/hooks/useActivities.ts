import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Activity = {
    id: number;
    lead_id: number;
    content: string;
    type: string;
    created_at: string;
    created_by: string;
    leads: {
        id: number;
        name: string;
        service: string;
        phone_number: string;
    };
};

export function useActivities() {
    const query = useQuery({
        queryKey: ["activities"],
        queryFn: async (): Promise<Activity[]> => {
            const res = await api.get("/activities");
            return res.data;
        },
    });

    return {
        activities: query.data ?? [],
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        refetch: query.refetch,
    };
}
